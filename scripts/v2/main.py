import asyncio
import httpx
import json
import os
import re
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Configuration
CITY = "Montpellier"
# The Place ID for Montpellier, France (from Google Places API)
PLACE_ID = "ChIJDyN2O23CtRIRMI_eT1v4_q0" 

UBER_EATS_API_URL = "https://www.ubereats.com/_p/api/getFeedV1"
SCRAPE_DO_TOKEN = os.getenv("SCRAPE_DO_TOKEN", "")
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "") 

if not all([SCRAPE_DO_TOKEN, SERPER_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("WARNING: Missing environment variables. Make sure SCRAPE_DO_TOKEN, SERPER_API_KEY, and SUPABASE credentials are set in .env")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Failed to initialize Supabase client: {e}")
    supabase = None

# Exclusion logic
EXCLUDED_DOMAINS = ["facebook", "instagram", "tripadvisor", "deliveroo", "just-eat", "ubereats", "tiktok"]

async def fetch_uber_eats_restaurants(client: httpx.AsyncClient):
    print(f"Fetching Uber Eats restaurants for {CITY}...")
    offset = 0
    page_size = 80
    has_more = True
    restaurants = []
    
    # In a production scenario, these might need to be dynamically updated or passed in
    csrf_token = os.getenv("UBER_CSRF_TOKEN", "dummy_csrf_token")
    cookie = os.getenv("UBER_COOKIE", "uev2.loc=dummy_location_cookie")

    while has_more:
        print(f"Fetching offset {offset}...")
        payload = {
            "placeId": PLACE_ID,
            "provider": "google_places",
            "source": "manual_auto_complete",
            "pageInfo": {
                "offset": offset,
                "pageSize": page_size
            }
        }
        
        headers = {
            "sd-x-csrf-token": csrf_token,
            "sd-cookie": cookie,
            "sd-content-type": "application/json"
        }
        
        params = {
            "token": SCRAPE_DO_TOKEN,
            "url": UBER_EATS_API_URL,
            "super": "true",
            "extraHeaders": "true"
        }
        
        try:
            # We add timeout because Scrape.do might take a while on super proxies
            response = await client.post("https://api.scrape.do", params=params, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            feed_items = data.get("data", {}).get("feedItems", [])
            for item in feed_items:
                store = item.get("store", {})
                if store:
                    uuid = store.get("storeUuid")
                    title = store.get("title", {}).get("text", "")
                    action_url = store.get("actionUrl", "")
                    if uuid and title:
                        restaurants.append({
                            "uuid": uuid,
                            "title": title,
                            "url": f"https://www.ubereats.com{action_url}" if action_url.startswith("/") else action_url
                        })
            
            has_more = data.get("data", {}).get("pageInfo", {}).get("hasMore", False)
            offset += page_size
            
            if not feed_items:
                print("No feed items returned. Exiting pagination loop.")
                break
                
        except Exception as e:
            print(f"Error fetching Uber Eats data: {e}")
            break
            
    return restaurants

def clean_restaurant_name(name):
    # Regex to clean up promotional text common on Uber Eats
    name = re.sub(r' - Livraison Offerte.*$', '', name, flags=re.IGNORECASE)
    name = re.sub(r' \(.*?\)', '', name)
    name = name.split('-')[0].strip()
    return name

async def enrich_with_serper(client: httpx.AsyncClient, restaurant):
    cleaned_name = clean_restaurant_name(restaurant["title"])
    query = f"{cleaned_name} restaurant, {CITY}, France"
    
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {"q": query}
    
    try:
        response = await client.post("https://google.serper.dev/places", json=payload, headers=headers, timeout=15.0)
        response.raise_for_status()
        data = response.json()
        
        places = data.get("places", [])
        if places:
            place = places[0]
            website = place.get("website", "")
            phone = place.get("phoneNumber", "")
            address = place.get("address", "")
            lat = place.get("latitude")
            lng = place.get("longitude")
            
            has_independent_website = True
            if not website:
                has_independent_website = False
            else:
                for domain in EXCLUDED_DOMAINS:
                    if domain in website.lower():
                        has_independent_website = False
                        break
                        
            return {
                "uber_store_uuid": restaurant["uuid"],
                "restaurant_name": restaurant["title"],
                "category": place.get("category", "Restaurant"),
                "city": CITY,
                "address": address,
                "phone_number": phone,
                "uber_eats_url": restaurant["url"],
                "website_url_found": website,
                "has_independent_website": has_independent_website,
                "latitude": lat,
                "longitude": lng,
                "last_enriched_at": datetime.utcnow().isoformat()
            }
    except Exception as e:
        print(f"Error enriching {query}: {e}")
    return None

async def main():
    print("--- ProspectHub V2 Scraping Pipeline ---")
    async with httpx.AsyncClient() as client:
        # 1. Extraction Uber Eats
        restaurants = await fetch_uber_eats_restaurants(client)
        print(f"Found {len(restaurants)} total restaurants on Uber Eats for {CITY}.")
        
        if not restaurants:
            print("No restaurants found. Please check your SCRAPE_DO_TOKEN, UBER_CSRF_TOKEN, and UBER_COOKIE.")
            return

        # 2. Enrichissement Google Maps (Serper)
        print("Starting enrichment process via Serper.dev...")
        enriched_data = []
        
        # We chunk the tasks to avoid overloading the async event loop / connection pool
        chunk_size = 20
        for i in range(0, len(restaurants), chunk_size):
            chunk = restaurants[i:i + chunk_size]
            tasks = [enrich_with_serper(client, r) for r in chunk]
            results = await asyncio.gather(*tasks)
            
            for r in results:
                if r:
                    enriched_data.append(r)
                    
            print(f"Processed {min(i + chunk_size, len(restaurants))}/{len(restaurants)}...")
        
        # 3. Filtrage stricte
        final_prospects = [p for p in enriched_data if not p.get("has_independent_website")]
        print(f"Found {len(final_prospects)} highly qualified prospects (no independent website).")
        
        # 4. Synchronisation Base de Données (Supabase upsert)
        if final_prospects and supabase:
            print("Sinking data to Supabase...")
            try:
                # Assuming the batch is small enough for a single bulk upsert. 
                # If final_prospects > 1000, we might need to batch this too.
                response = supabase.table("prospects_v2").upsert(
                    final_prospects,
                    on_conflict="uber_store_uuid"
                ).execute()
                print("Supabase upsert completed successfully!")
            except Exception as e:
                print(f"Supabase upsert failed: {e}")
        else:
            if not supabase:
                print("Supabase client not initialized. Skipping database sink.")
                # Print sample output instead
                print(json.dumps(final_prospects[:2], indent=2))

if __name__ == "__main__":
    asyncio.run(main())
