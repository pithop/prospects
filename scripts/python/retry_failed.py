import os
import sys
import json
import requests
from dotenv import load_dotenv
import time

load_dotenv()

# The specific files we know failed due to the API 500 error
FAILED_FILES = [
    {"file": "13001_Marseille_Kebab.json", "zip": "13001", "name": "Marseille"},
    {"file": "31000_Toulouse_Sushi.json", "zip": "31000", "name": "Toulouse"},
    {"file": "76000_Rouen_Restaurant_Italien.json", "zip": "76000", "name": "Rouen"},
    {"file": "76000_Rouen_Restaurant_Indien.json", "zip": "76000", "name": "Rouen"}
]

RESULTS_DIR = "data/results"
API_URL = os.getenv("PROSPECTING_API_URL", "https://prospecthub-vercel.vercel.app/api/import")
SECRET_KEY = os.getenv("PROSPECTING_SECRET_KEY", "prospecthub_super_secret_dev_key_2026")

def normalize_time(t):
    if not t or not isinstance(t, dict): return None
    t = {k: v for k, v in t.items() if v is not None}
    if not t: return None
    day_mapping = {
        'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
        'Friday': 4, 'Saturday': 5, 'Sunday': 6
    }
    normalized = {}
    for day, times in t.items():
        if not times: continue
        d_idx = day_mapping.get(day)
        if d_idx is None: continue
        
        day_pops = []
        for hour, pop in times.items():
            hour_int = int(hour.replace('h', ''))
            day_pops.append({
                "timeId": f"{d_idx}{hour_int:02d}",
                "hourOfDay": hour_int,
                "popularity": pop
            })
        
        normalized[day] = day_pops
    return normalized

def calculate_best_time(popular_times):
    if not popular_times or not isinstance(popular_times, dict): return None
    
    highest_pop = -1
    best_day = None
    best_hour = None
    
    for day, day_data in popular_times.items():
        for slot in day_data:
            if slot['popularity'] > highest_pop:
                highest_pop = slot['popularity']
                best_day = day
                best_hour = slot['hourOfDay']
                
    if best_day and best_hour is not None:
        return f"{best_day} à {best_hour}h"
    return None

def main():
    print(f"--- Retrying Failed Uploads to {API_URL} ---")
    
    for job in FAILED_FILES:
        filepath = os.path.join(RESULTS_DIR, job["file"])
        if not os.path.exists(filepath):
            print(f"❌ File not found: {filepath}. Skipping.")
            continue
            
        print(f"Reading {filepath}...")
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    print("File empty.")
                    continue
                try:
                    data = json.loads(content)
                except json.JSONDecodeError:
                    lines = content.split('\n')
                    data = [json.loads(line) for line in lines if line.strip()]
        except Exception as e:
            print(f"Error reading file: {e}")
            continue

        for item in data:
            item['source_city_zip'] = job['zip']
            item['source_city_name'] = job['name']
            if 'link' in item:
                item['google_maps_url'] = item['link']
            
            p_times = item.get('popular_times')
            if p_times:
                normalized = normalize_time(p_times)
                item['popular_times'] = normalized
                item['best_time_to_call'] = calculate_best_time(normalized)

        payload = { "items": data, "city": f"{job['zip']} {job['name']}" }
        headers = { 'x-secret-key': SECRET_KEY, 'Content-Type': 'application/json' }
        
        try:
            response = requests.post(API_URL, json=payload, headers=headers)
            if response.status_code == 201:
                print(f"✅ Success! Uploaded {len(data)} items for {job['file']}")
            else:
                print(f"❌ Failed to upload {job['file']}: {response.status_code} - {response.text}")
        except Exception as e:
             print(f"❌ Request error: {e}")
             
        time.sleep(2) # Prevent rate limiting

    print("\n✅ Retry script finished.")

if __name__ == "__main__":
    main()
