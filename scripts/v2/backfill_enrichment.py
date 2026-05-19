"""
ProspectHub V2 — Backfill Enrichment via Google Maps (Zyte)
=============================================================
Rattrapage des données manquantes (téléphone, horaires, adresse, site web)
en scrapant directement les fiches Google Maps via l'API Zyte browserHtml.

Usage: python3 scripts/v2/backfill_enrichment.py
"""
import asyncio
import httpx
import os
import re
import json
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ======================== CONFIGURATION ========================
ZYTE_API_KEY = os.getenv("ZYTE_API_KEY", "")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not all([ZYTE_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Missing ZYTE_API_KEY, SUPABASE_URL, or SUPABASE_KEY in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Regex to find emails in text
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')

EXCLUDED_EMAILS = [
    "noreply", "no-reply", "support@uber", "privacy@", "example.com",
    "sentry.io", "wixpress.com", "googleapis.com", "schema.org",
    "gstatic.com", "google.com", "youtube.com", "ggpht.com",
    "googleusercontent.com", "mozilla.org"
]

EXCLUDED_WEBSITE_DOMAINS = [
    "facebook.com", "instagram.com", "tripadvisor", "deliveroo",
    "just-eat", "ubereats", "tiktok.com", "yelp.com",
    "lafourchette.com", "thefork.com", "pagesjaunes.fr",
    "google.com", "linkedin.com", "twitter.com", "x.com"
]

# Delay between Zyte calls (seconds) to be respectful
DELAY_BETWEEN_CALLS = 1.5

# ======================== EXTRACTION ========================

async def scrape_google_maps_page(client: httpx.AsyncClient, gmaps_url: str):
    """
    Use Zyte browserHtml to render a Google Maps place page.
    Extract: phone, address, website, opening_hours
    """
    try:
        response = await client.post(
            "https://api.zyte.com/v1/extract",
            auth=(ZYTE_API_KEY, ""),
            json={
                "url": gmaps_url,
                "browserHtml": True,
            },
            timeout=60.0
        )

        if response.status_code == 429:
            print("  ⚠️  Zyte rate limit hit, waiting 10s...")
            await asyncio.sleep(10)
            return None

        if response.status_code != 200:
            print(f"  ❌ Zyte error {response.status_code}: {response.text[:200]}")
            return None

        html = response.json().get("browserHtml", "")
        if not html:
            return None

        result = {}

        # 1. Extract PHONE from data-item-id="phone:tel:..."
        phone_match = re.search(r'data-item-id="phone:tel:([^"]+)"', html)
        if phone_match:
            raw_phone = phone_match.group(1)
            # Format nicely: +33612345678 -> +33 6 12 34 56 78
            if raw_phone.startswith("+33") and len(raw_phone) == 12:
                formatted = f"+33 {raw_phone[3]} {raw_phone[4:6]} {raw_phone[6:8]} {raw_phone[8:10]} {raw_phone[10:12]}"
                result["phone_number"] = formatted
            else:
                result["phone_number"] = raw_phone

        # 2. Extract ADDRESS from aria-label="Address: ..."
        addr_match = re.search(
            r'aria-label="(?:Address|Adresse)\s*:\s*([^"]+)"',
            html, re.IGNORECASE
        )
        if addr_match:
            result["address"] = addr_match.group(1).strip()

        # 3. Extract WEBSITE from aria-label="Website: ..."
        web_match = re.search(
            r'aria-label="(?:Website|Site\s*web)\s*:\s*([^"]+)"',
            html, re.IGNORECASE
        )
        if web_match:
            website = web_match.group(1).strip()
            # Check if it's an independent website (not social media)
            is_independent = True
            for excluded in EXCLUDED_WEBSITE_DOMAINS:
                if excluded in website.lower():
                    is_independent = False
                    break
            result["website_url_found"] = website
            result["has_independent_website"] = is_independent

        # 4. Extract OPENING HOURS
        # Google Maps puts hours in aria-labels like "Monday, 11 AM to 10 PM"
        hours_entries = re.findall(
            r'aria-label="((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|'
            r'lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)'
            r'[^"]*(?:\d{1,2}\s*(?:AM|PM|:\d{2})|Closed|Fermé)[^"]*)"',
            html, re.IGNORECASE
        )
        if hours_entries:
            # Clean up and deduplicate
            clean_hours = []
            seen = set()
            for entry in hours_entries:
                # Remove "Copy open hours" suffix
                entry = re.sub(r',?\s*Copy open hours.*', '', entry).strip()
                entry = re.sub(r',?\s*Copier les horaires.*', '', entry).strip()
                if entry and entry not in seen:
                    seen.add(entry)
                    clean_hours.append(entry)
            if clean_hours:
                result["opening_hours"] = " | ".join(clean_hours[:7])  # Max 7 days

        # 5. Try to find EMAIL in the page
        all_emails = EMAIL_REGEX.findall(html)
        for email in all_emails:
            email_lower = email.lower()
            is_valid = True
            for excluded in EXCLUDED_EMAILS:
                if excluded in email_lower:
                    is_valid = False
                    break
            if is_valid and not email_lower.endswith(('.png', '.jpg', '.js', '.css')):
                result["email"] = email
                break

        return result if result else None

    except httpx.TimeoutException:
        print("  ⏱️  Timeout on Zyte request")
        return None
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None


# ======================== MAIN ========================

async def main():
    print("=" * 60)
    print("  ProspectHub V2 — Backfill via Google Maps (Zyte)")
    print("=" * 60)

    # 1. Fetch prospects that need enrichment
    print("\n📥 Fetching prospects from Supabase...")
    try:
        # Get all prospects that have a google_maps_url but are missing phone
        response = supabase.table("prospects_v2").select("*").execute()
        all_prospects = response.data
    except Exception as e:
        print(f"❌ Failed to fetch from Supabase: {e}")
        return

    # Filter to those needing enrichment (no phone number)
    needs_enrichment = [
        p for p in all_prospects
        if p.get("google_maps_url")
        and p["google_maps_url"].startswith("https://")
        and (not p.get("phone_number") or not p.get("opening_hours"))
    ]

    print(f"  Total in DB: {len(all_prospects)}")
    print(f"  Need enrichment: {len(needs_enrichment)}")

    if not needs_enrichment:
        print("✅ All prospects already have phone numbers and hours!")
        return

    # 2. Process each prospect
    print(f"\n🔬 Starting backfill ({len(needs_enrichment)} prospects)...")

    stats = {"updated": 0, "phone_found": 0, "email_found": 0, "hours_found": 0, "errors": 0}

    async with httpx.AsyncClient() as client:
        for i, prospect in enumerate(needs_enrichment):
            name = prospect["restaurant_name"]
            uuid = prospect["uber_store_uuid"]
            gmaps_url = prospect["google_maps_url"]

            try:
                result = await scrape_google_maps_page(client, gmaps_url)

                if result:
                    # Build update dict (only non-empty fields)
                    update_data = {"last_enriched_at": datetime.now(timezone.utc).isoformat()}

                    if result.get("phone_number") and not prospect.get("phone_number"):
                        update_data["phone_number"] = result["phone_number"]
                        stats["phone_found"] += 1

                    if result.get("address") and (not prospect.get("address") or prospect["address"].endswith(", France")):
                        update_data["address"] = result["address"]

                    if result.get("website_url_found"):
                        update_data["website_url_found"] = result["website_url_found"]
                        update_data["has_independent_website"] = result.get("has_independent_website", False)

                    if result.get("opening_hours") and not prospect.get("opening_hours"):
                        update_data["opening_hours"] = result["opening_hours"]
                        stats["hours_found"] += 1

                    if result.get("email") and not prospect.get("email"):
                        update_data["email"] = result["email"]
                        stats["email_found"] += 1

                    # Update in Supabase
                    if len(update_data) > 1:  # More than just last_enriched_at
                        supabase.table("prospects_v2").update(update_data).eq(
                            "uber_store_uuid", uuid
                        ).execute()
                        stats["updated"] += 1

            except Exception as e:
                print(f"  ❌ Error on {name}: {e}")
                stats["errors"] += 1

            # Progress
            processed = i + 1
            if processed % 5 == 0 or processed == len(needs_enrichment):
                print(
                    f"  ✅ {processed}/{len(needs_enrichment)} "
                    f"(📞 {stats['phone_found']} phones, "
                    f"📧 {stats['email_found']} emails, "
                    f"🕐 {stats['hours_found']} hours)"
                )

            # Rate limiting
            await asyncio.sleep(DELAY_BETWEEN_CALLS)

    # 3. Final stats
    print(f"\n{'=' * 60}")
    print(f"  📊 BACKFILL TERMINÉ")
    print(f"{'=' * 60}")
    print(f"  Prospects mis à jour:  {stats['updated']}")
    print(f"  Téléphones trouvés:    {stats['phone_found']}")
    print(f"  Emails trouvés:        {stats['email_found']}")
    print(f"  Horaires trouvés:      {stats['hours_found']}")
    print(f"  Erreurs:               {stats['errors']}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(main())
