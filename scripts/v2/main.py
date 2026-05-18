"""
ProspectHub V2 — Pipeline d'Extraction & Enrichissement Maximum
================================================================
Cible: Restaurants sur Uber Eats à Montpellier SANS site web indépendant.
Sources: Uber Eats API (via Zyte proxy) + Serper.dev (Places + Search)
Output: Upsert vers Supabase table prospects_v2
"""
import asyncio
import httpx
import json
import os
import re
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ======================== CONFIGURATION ========================
CITY = "Montpellier"
PLACE_ID = "ChIJsZ3dJQevthIRAuiUKHRWh60"  # Must match cookie uev2.loc

UBER_EATS_API_URL = "https://www.ubereats.com/_p/api/getFeedV1"
ZYTE_API_KEY = os.getenv("ZYTE_API_KEY", "")
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not all([ZYTE_API_KEY, SERPER_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("⚠️  WARNING: Missing environment variables.")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"❌ Failed to initialize Supabase client: {e}")
    supabase = None

# Domains to exclude when checking for independent websites
EXCLUDED_DOMAINS = [
    "facebook", "instagram", "tripadvisor", "deliveroo", "just-eat",
    "ubereats", "tiktok", "yelp", "lafourchette", "thefork",
    "pagesjaunes", "google.com/maps", "linkedin", "twitter", "x.com"
]

# Regex to find emails in text
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')

# Emails to exclude (generic/spam)
EXCLUDED_EMAILS = [
    "noreply", "no-reply", "support@uber", "privacy@", "example.com",
    "sentry.io", "wixpress.com", "googleapis.com", "schema.org"
]

# ======================== UBER EATS EXTRACTION ========================

def convert_price_bucket(bucket):
    """Convert Uber Eats priceBucket integer to readable format."""
    mapping = {1: "€", 2: "€€", 3: "€€€", 4: "€€€€"}
    return mapping.get(bucket, "")

async def fetch_uber_eats_restaurants():
    """
    Fetch all restaurants from Uber Eats for the configured city.
    Returns a list of dicts with uuid, title, url, uber_rating, price_range.
    """
    print(f"🔍 Fetching Uber Eats restaurants for {CITY}...")
    offset = 0
    page_size = 80
    has_more = True
    restaurants = []

    csrf_token = os.getenv("UBER_CSRF_TOKEN") or "x"
    cookie = os.getenv("UBER_COOKIE") or ""

    proxy = f"http://{ZYTE_API_KEY}:@api.zyte.com:8011"

    async with httpx.AsyncClient(proxy=proxy, verify=False) as client:
        while has_more:
            print(f"  📄 Fetching offset {offset}...")
            payload = {
                "placeId": PLACE_ID,
                "provider": "google_places",
                "source": "manual_auto_complete",
                "pageInfo": {"offset": offset, "pageSize": page_size}
            }

            headers = {
                "x-csrf-token": csrf_token,
                "cookie": cookie,
                "content-type": "application/json",
                "accept": "*/*",
                "origin": "https://www.ubereats.com",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "X-Crawlera-Region": "FR"
            }

            try:
                response = await client.post(
                    UBER_EATS_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=45.0
                )
                response.raise_for_status()
                data = response.json()

                feed_items = data.get("data", {}).get("feedItems", [])
                stores_map = data.get("data", {}).get("storesMap", {})

                for item in feed_items:
                    store = item.get("store", {})
                    if not store:
                        continue

                    uuid = store.get("storeUuid")
                    title = store.get("title", {}).get("text", "")
                    action_url = store.get("actionUrl", "")

                    if not uuid or not title:
                        continue

                    # Extract extra data from the store object
                    uber_rating_obj = store.get("rating", {})
                    uber_rating = None
                    if uber_rating_obj and isinstance(uber_rating_obj, dict):
                        uber_rating = uber_rating_obj.get("text")
                        if uber_rating:
                            try:
                                uber_rating = float(uber_rating)
                            except (ValueError, TypeError):
                                uber_rating = None

                    price_bucket = store.get("priceBucket")
                    price_range = convert_price_bucket(price_bucket) if price_bucket else ""

                    # Also check storesMap for richer data
                    store_detail = stores_map.get(uuid, {})
                    if not uber_rating and store_detail:
                        rating_obj = store_detail.get("rating", {})
                        if rating_obj and isinstance(rating_obj, dict):
                            try:
                                uber_rating = float(rating_obj.get("text", 0))
                            except (ValueError, TypeError):
                                uber_rating = None

                    restaurants.append({
                        "uuid": uuid,
                        "title": title,
                        "url": f"https://www.ubereats.com{action_url}" if action_url.startswith("/") else action_url,
                        "uber_rating": uber_rating,
                        "price_range": price_range
                    })

                has_more = data.get("data", {}).get("meta", {}).get("hasMore", False)
                # Also check the older path
                if not has_more:
                    has_more = data.get("data", {}).get("pageInfo", {}).get("hasMore", False)
                offset += page_size

                if len(restaurants) == 0:
                    print("  ❌ No restaurants found in response.")
                    print("  --- DEBUG (first 800 chars) ---")
                    print(response.text[:800])
                    print("  -------------------------------")
                    break

            except Exception as e:
                print(f"  ❌ Error fetching Uber Eats data: {e}")
                break

    return restaurants

# ======================== ENRICHMENT ========================

def clean_restaurant_name(name):
    """Clean promotional text from Uber Eats restaurant names."""
    name = re.sub(r'\s*-\s*Livraison Offerte.*$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s*-\s*Frais de livraison offerts.*$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s*\(.*?\)', '', name)  # Remove parenthetical text
    # Remove emojis (common on Uber Eats names)
    name = re.sub(r'[\U0001F1E0-\U0001F9FF]', '', name)
    name = name.split(' - ')[0].strip()  # Keep only the part before " - "
    return name.strip()

def is_valid_email(email):
    """Check if email is valid and not a generic/spam address."""
    email_lower = email.lower()
    for excluded in EXCLUDED_EMAILS:
        if excluded in email_lower:
            return False
    # Must have a reasonable domain
    if email_lower.endswith(('.png', '.jpg', '.gif', '.svg', '.js', '.css')):
        return False
    return True

async def enrich_with_serper_places(client: httpx.AsyncClient, restaurant):
    """
    Enrich a restaurant with Google Maps data via Serper Places API.
    Returns: phone, address, lat, lng, rating, reviews_count, website, google_maps_url, opening_hours
    """
    cleaned_name = clean_restaurant_name(restaurant["title"])
    query = f"{cleaned_name} restaurant {CITY}"

    headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}
    payload = {"q": query}

    try:
        response = await client.post(
            "https://google.serper.dev/places",
            json=payload, headers=headers, timeout=15.0
        )
        response.raise_for_status()
        data = response.json()

        places = data.get("places", [])
        if not places:
            return None

        place = places[0]

        website = place.get("website", "") or ""
        phone = place.get("phoneNumber", "") or ""
        address = place.get("address", "") or ""
        lat = place.get("latitude")
        lng = place.get("longitude")
        rating = place.get("rating")
        reviews_count = place.get("ratingCount")
        cid = place.get("cid")
        opening_hours = place.get("openingHours")

        # Build Google Maps URL from cid
        google_maps_url = ""
        if cid:
            google_maps_url = f"https://www.google.com/maps?cid={cid}"

        # Format opening hours as readable text
        hours_text = ""
        if opening_hours and isinstance(opening_hours, dict):
            parts = []
            for day, hours in opening_hours.items():
                if isinstance(hours, list):
                    parts.append(f"{day}: {', '.join(hours)}")
                elif isinstance(hours, str):
                    parts.append(f"{day}: {hours}")
            hours_text = " | ".join(parts)

        # Check for independent website
        has_independent_website = True
        if not website:
            has_independent_website = False
        else:
            for domain in EXCLUDED_DOMAINS:
                if domain in website.lower():
                    has_independent_website = False
                    break

        return {
            "phone_number": phone,
            "address": address,
            "latitude": lat,
            "longitude": lng,
            "rating": rating,
            "reviews_count": reviews_count,
            "website_url_found": website,
            "has_independent_website": has_independent_website,
            "google_maps_url": google_maps_url,
            "opening_hours": hours_text,
            "category": place.get("category", "Restaurant")
        }

    except Exception as e:
        print(f"  ⚠️  Serper Places error for '{cleaned_name}': {e}")
        return None


async def find_email_via_serper(client: httpx.AsyncClient, restaurant_name):
    """
    Try to find an email for a restaurant using Serper web search.
    Searches for the restaurant name + city + "email" or "contact".
    """
    cleaned_name = clean_restaurant_name(restaurant_name)
    query = f"{cleaned_name} {CITY} email contact restaurant"

    headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}
    payload = {"q": query, "num": 5}

    try:
        response = await client.post(
            "https://google.serper.dev/search",
            json=payload, headers=headers, timeout=15.0
        )
        response.raise_for_status()
        data = response.json()

        # Search through organic results for email patterns
        all_text = ""
        for result in data.get("organic", []):
            all_text += " " + result.get("title", "")
            all_text += " " + result.get("snippet", "")

        # Also check the knowledge graph
        kg = data.get("knowledgeGraph", {})
        if kg:
            all_text += " " + json.dumps(kg)

        # Find all emails in the aggregated text
        emails = EMAIL_REGEX.findall(all_text)
        for email in emails:
            if is_valid_email(email):
                return email

    except Exception as e:
        # Silently fail - email is a bonus, not critical
        pass

    return None


async def enrich_single_restaurant(client: httpx.AsyncClient, restaurant):
    """
    Full enrichment pipeline for a single restaurant.
    Combines Uber Eats data + Serper Places + Serper email search.
    """
    # Step 1: Serper Places enrichment
    places_data = await enrich_with_serper_places(client, restaurant)

    if not places_data:
        return None

    # Step 2: Email search (only if no independent website - our real targets)
    email = None
    if not places_data["has_independent_website"]:
        # Small delay before email search to avoid rate limits
        await asyncio.sleep(0.5)
        email = await find_email_via_serper(client, restaurant["title"])

    # Build the complete prospect record
    return {
        "uber_store_uuid": restaurant["uuid"],
        "restaurant_name": restaurant["title"],
        "category": places_data.get("category", "Restaurant"),
        "city": CITY,
        "address": places_data.get("address", ""),
        "phone_number": places_data.get("phone_number", ""),
        "email": email,
        "uber_eats_url": restaurant["url"],
        "website_url_found": places_data.get("website_url_found", ""),
        "has_independent_website": places_data["has_independent_website"],
        "google_maps_url": places_data.get("google_maps_url", ""),
        "latitude": places_data.get("latitude"),
        "longitude": places_data.get("longitude"),
        "rating": places_data.get("rating"),
        "reviews_count": places_data.get("reviews_count"),
        "uber_eats_rating": restaurant.get("uber_rating"),
        "price_range": restaurant.get("price_range", ""),
        "opening_hours": places_data.get("opening_hours", ""),
        "contact_status": "new",
        "last_enriched_at": datetime.now(timezone.utc).isoformat()
    }


# ======================== MAIN PIPELINE ========================

async def main():
    print("=" * 60)
    print("  ProspectHub V2 — Pipeline d'Extraction Maximum")
    print("=" * 60)

    # 1. EXTRACTION: Uber Eats
    restaurants = await fetch_uber_eats_restaurants()
    print(f"\n📊 Found {len(restaurants)} total restaurants on Uber Eats for {CITY}.")

    if not restaurants:
        print("❌ No restaurants found. Check ZYTE_API_KEY, UBER_CSRF_TOKEN, UBER_COOKIE.")
        return

    # 2. ENRICHMENT: Serper Places + Email Search
    print("\n🔬 Starting enrichment (Serper Places + Email search)...")
    enriched_data = []

    async with httpx.AsyncClient() as client:
        # Process in small chunks with delays to respect rate limits
        chunk_size = 3
        for i in range(0, len(restaurants), chunk_size):
            chunk = restaurants[i:i + chunk_size]
            tasks = [enrich_single_restaurant(client, r) for r in chunk]
            results = await asyncio.gather(*tasks)

            for r in results:
                if r:
                    enriched_data.append(r)

            processed = min(i + chunk_size, len(restaurants))
            print(f"  ✅ Processed {processed}/{len(restaurants)}...")
            await asyncio.sleep(2)  # Rate limiting between chunks

    # 3. DEDUPLICATION: Uber Eats returns duplicates across pages
    seen_uuids = {}
    for p in enriched_data:
        uuid = p["uber_store_uuid"]
        if uuid not in seen_uuids:
            seen_uuids[uuid] = p
        else:
            # Keep the entry with more data (prefer one with email/phone)
            existing = seen_uuids[uuid]
            if p.get("email") and not existing.get("email"):
                seen_uuids[uuid] = p
            elif p.get("phone_number") and not existing.get("phone_number"):
                seen_uuids[uuid] = p
    enriched_data = list(seen_uuids.values())

    # 4. FILTERING: Keep only prospects WITHOUT independent website
    all_enriched = len(enriched_data)
    final_prospects = [p for p in enriched_data if not p.get("has_independent_website")]

    # Stats
    with_email = sum(1 for p in final_prospects if p.get("email"))
    with_phone = sum(1 for p in final_prospects if p.get("phone_number"))
    with_rating = sum(1 for p in final_prospects if p.get("rating"))

    print(f"\n{'=' * 60}")
    print(f"  📊 RÉSULTATS FINAUX")
    print(f"{'=' * 60}")
    print(f"  Total enrichis (uniques):    {all_enriched}")
    print(f"  Prospects qualifiés (no web): {len(final_prospects)}")
    print(f"  Avec téléphone:              {with_phone}")
    print(f"  Avec email:                  {with_email}")
    print(f"  Avec rating Google:          {with_rating}")
    print(f"{'=' * 60}")

    # 5. SYNC: Upsert to Supabase
    if final_prospects and supabase:
        print("\n💾 Syncing to Supabase...")
        try:
            # Upsert one by one to avoid any duplicate conflicts within batches
            success_count = 0
            for p in final_prospects:
                try:
                    supabase.table("prospects_v2").upsert(
                        p,
                        on_conflict="uber_store_uuid"
                    ).execute()
                    success_count += 1
                except Exception as e:
                    print(f"  ⚠️  Skipped {p.get('restaurant_name', '?')}: {e}")
            print(f"  ✅ Upserted {success_count}/{len(final_prospects)} prospects.")

            print(f"\n🎉 SUCCESS! {len(final_prospects)} prospects saved to Supabase!")
        except Exception as e:
            print(f"  ❌ Supabase upsert failed: {e}")
    elif not supabase:
        print("\n⚠️  Supabase not initialized. Printing sample data instead:")
        print(json.dumps(final_prospects[:3], indent=2, ensure_ascii=False))
    else:
        print("\n⚠️  No qualified prospects found.")


if __name__ == "__main__":
    asyncio.run(main())
