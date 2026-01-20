#!/usr/bin/env python3
import csv
import subprocess
import time
import random
import os
import json
import logging
import requests
from datetime import datetime

# ================= CONFIGURATION =================
# Path to the gosom binary executable
SCRAPER_BINARY = "./scraper-app"

# Path to the Curated Cities CSV
CSV_FILE = "data/target_cities.csv"

# File to store the index of the last successfully processed city
STATE_FILE = "last_city_index.txt"

# ... (Previous config lines) ...

def load_cities(csv_path):
    """
    Parses the Curated Cities CSV.
    """
    cities = []
    if not os.path.exists(csv_path):
        logging.error(f"CSV file not found at {csv_path}")
        exit(1)

    try:
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=',')
            for row in reader:
                if 'nom_commune_postal' in row and 'code_postal' in row:
                    cities.append({
                        'name': row['nom_commune_postal'],
                        'zip': row['code_postal']
                    })
    except Exception as e:
        logging.error(f"Failed to parse CSV: {e}")
        exit(1)
    
    logging.info(f"Successfully loaded {len(cities)} TARGET cities.")
    return cities

# Directory to save individual JSON results (as backup)
OUTPUT_DIR = "data/results"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Directory to store error logs
LOG_FILE = "logs/automation.log"
os.makedirs("logs", exist_ok=True)

# The Query Keyword (The Niche)
# Change this to whatever business type you are prospecting
SEARCH_NICHE = "Restaurant"

# Scraper Settings
DEPTH = 2
THREADS = 1

# API Configuration
API_URL = "http://localhost:3000/api/import"
API_SECRET_KEY = "super_secret_prospecting_key_2026" # CHANGE THIS

# ================= SETUP LOGGING =================
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logging.getLogger('').addHandler(console)

# ================= CORE FUNCTIONS =================



def get_state():
    """Reads the persistence file to find where we left off."""
    if not os.path.exists(STATE_FILE):
        return 0
    try:
        with open(STATE_FILE, 'r') as f:
            content = f.read().strip()
            if not content: return 0
            return int(content)
    except ValueError:
        return 0

def save_state(index):
    """Updates the persistence file."""
    with open(STATE_FILE, 'w') as f:
        f.write(str(index))

def cleanup_zombies():
    """
    Aggressive cleanup of potential zombie Chrome processes.
    Only run this if you are sure no other Chrome instances are needed on the PC.
    """
    try:
        # Check for chromium processes owned by this user
        subprocess.run(["pkill", "-f", "chromium"], check=False)
        subprocess.run(["pkill", "-f", "chrome"], check=False)
    except Exception:
        pass

def run_scraper_job(city_data, job_id):
    """
    Orchestrates a single scraping job for one city.
    """
    # Strategy: "Hybrid" - Targeted Cities + Targeted Niches
    # We filter specifically for high-conversion categories identified in the report.
    
    niches = [
        "Restaurant",             # Catch-all
        "Pizzeria",               # High propensity for Click & Collect
        "Sushi",                  # High delivery volume
        "Restaurant Italien",     # Visual heavy
        "Restaurant Indien",      # Takeout volume
        "Burger",                 # Branding heavy
        "Kebab"                   # Volume
    ]
    
    for niche in niches:
        query = f"{niche} {city_data['zip']} {city_data['name']}"
        temp_input = f"temp_{job_id}_{niche.replace(' ', '_')}.txt"
        
        # Cleanup potential old temp files
        if os.path.exists(temp_input): os.remove(temp_input)
            
        with open(temp_input, 'w', encoding='utf-8') as f:
            f.write(query)
            
        output_file = os.path.join(OUTPUT_DIR, f"{city_data['zip']}_{city_data['name']}_{niche.replace(' ', '_')}.json")
        
        # Depth 5 is good balance
        cmd = [
            SCRAPER_BINARY,
            "-input", temp_input,
            "-results", output_file,
            "-depth", "5", 
            "-json",
            "-c", str(THREADS)
        ]
        
        logging.info(f"Job {job_id}: Scraping '{query}'...")
        
        try:
             # run scraper
             res = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
             
             if res.returncode != 0:
                 logging.error(f"Scraper command failed with code {res.returncode}")
                 logging.error(f"Stderr: {res.stderr}")
             
             if os.path.exists(output_file) and os.path.getsize(output_file) > 50:
                 process_and_upload(output_file, city_data)
             else:
                 logging.warning(f"No results found for {niche} in {city_data['name']} (File empty or missing)")
                 if res.stderr:
                     logging.warning(f"Scraper Stderr: {res.stderr}")

        except Exception as e:
             logging.error(f"Job {job_id} Niche {niche} Failed: {e}")
        finally:
            if os.path.exists(temp_input):
                 os.remove(temp_input)
                 
    # We return success True because we attempted the niches. 
    # Even if one fails, we consider the "City Job" done to move to next city.
    return True


def calculate_best_time(popular_times):
    """
    Calculates the best time to call based on popular times data.
    Logic: Lowest traffic between 10-11am or 3-4pm, preferably Tue/Wed/Thu.
    """
    if not popular_times or not isinstance(popular_times, dict):
        return None
        
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    best_day = ''
    lowest_traffic = 100
    selected_slot = ''
    
    for day in days:
        if day in popular_times:
            day_data = popular_times[day]
            
            # Check morning slot (10am) - handling string keys if necessary
            morning_traffic = day_data.get("10", 0) 
            if morning_traffic == 0: morning_traffic = day_data.get(10, 0)
            
            # Check afternoon slot (3pm)
            afternoon_traffic = day_data.get("15", 0)
            if afternoon_traffic == 0: afternoon_traffic = day_data.get(15, 0)
            
            # Prefer afternoon if traffic is low
            if 0 < afternoon_traffic < lowest_traffic:
                lowest_traffic = afternoon_traffic
                best_day = day
                selected_slot = "15h (Afternoon)"
            
            # Check morning if it's even better
            if 0 < morning_traffic < lowest_traffic:
                lowest_traffic = morning_traffic
                best_day = day
                selected_slot = "10h (Morning)"
                
    if best_day:
        return f"{best_day} around {selected_slot} ({lowest_traffic}% busy)"
    return None

def process_and_upload(json_file_path, city_data):
    """
    Reads the scraped JSON, wraps it in the expected format, and POSTs to API.
    """
    try:
        data = []
        with open(json_file_path, 'r', encoding='utf-8') as f:
            # gosom output is typically NDJSON (New-line Delimited JSON)
            # We try to read it as a standard JSON first, validity check, then fallback to NDJSON
            try:
                # Try entire file as JSON
                content = f.read()
                if not content.strip():
                    return # Empty file
                    
                json_data = json.loads(content)
                if isinstance(json_data, list):
                    data = json_data
                elif isinstance(json_data, dict):
                    data = [json_data]
            except json.JSONDecodeError:
                # Fallback to NDJSON (Line by Line)
                f.seek(0)
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            data.append(json.loads(line))
                        except json.JSONDecodeError:
                            pass # Skip invalid lines
        
        if not data:
            logging.warning(f"No valid data found in {json_file_path}")
            return
            
        # Enrich data with city info if needed
        for item in data:
            item['source_city_zip'] = city_data['zip']
            item['source_city_name'] = city_data['name']
            
            # Map Link -> google_maps_url
            if 'link' in item:
                item['google_maps_url'] = item['link']
                
            # Calculate Best Time to Call
            if 'popular_times' in item:
                item['best_time_to_call'] = calculate_best_time(item['popular_times'])

        # Wrap for API: { "items": [...] }
        payload = { "items": data }
        
        # Send to API
        headers = {
            "Content-Type": "application/json",
            "x-secret-key": API_SECRET_KEY
        }
        
        try:
            response = requests.post(API_URL, json=payload, headers=headers)
            if response.status_code in [200, 201]:
                logging.info(f"API Upload Success: Sent {len(data)} items.")
            else:
                logging.error(f"API Upload Failed: {response.status_code} - {response.text}")
        except requests.exceptions.ConnectionError:
            logging.error(f"API Connection Error: Could not reach {API_URL}")
            
    except Exception as e:
        logging.error(f"Failed to process/upload results: {e}")

# ================= MAIN LOOP =================

def main():
    logging.info("Starting Automation Wrapper...")
    
    if not os.path.exists(SCRAPER_BINARY):
        logging.error(f"Scraper binary not found at {SCRAPER_BINARY}. Run setup.sh first.")
        exit(1)

    # Load Data
    cities = load_cities(CSV_FILE)
    
    # Restore State
    start_index = get_state()
    logging.info(f"Resuming from City Index: {start_index}")
    
    if start_index >= len(cities):
        logging.info("All cities processed!")
        return

    # Iterate
    for i in range(start_index, len(cities)):
        city = cities[i]
        
        # Run Job
        run_scraper_job(city, i)
        
        # Commit State immediately
        save_state(i + 1)
        
        # Anti-Ban Sleep Strategy
        sleep_time = random.randint(10, 30)
        logging.info(f"Sleeping for {sleep_time}s...")
        time.sleep(sleep_time)
        
        # Periodic Long Pause
        if i > 0 and i % 500 == 0:
            logging.info("Hit 500 query mark. Taking a 5-minute cool-down break.")
            time.sleep(300)

if __name__ == "__main__":
    main()
