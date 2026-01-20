# Zero-Touch French Prospecting Bot

This automated system scrapes business leads from Google Maps across ~35,000 French communes and uploads them to your Supabase application.

## 1. Quick Start

### Prerequisites
- Ubuntu / Linux environment.
- Python 3.
- `Google Chrome` or `Chromium` installed (for the headless browser).

### Setup
Run the setup script to download the `gosom` binary and the data source:
```bash
./setup.sh
```
This will create:
- `data/` (containing `communes.csv`)
- `logs/`
- `scraper-app` (the Go binary)

### Configuration
1. **API Key**: The system uses a secret key to secure uploads.
   - Default: `super_secret_prospecting_key_2026`
   - **Action**: Change this in `master_driver.py` (`API_SECRET_KEY`) and in your `.env` file (`PROSPECTING_SECRET_KEY`) for production safety.

2. **Niche**: Edit `master_driver.py` to change `SEARCH_NICHE` (default: "Restaurant").

## 2. Running the Bot
Start the controller in the background (or in a screen session):
```bash
./master_driver.py
```

### How it Works
1. **Parsing**: Loads cities from `data/communes.csv`.
2. **State**: Reads `last_city_index.txt` to resume where it left off.
3. **Scraping**: Runs `./scraper-app` for each city.
4. **Upload**: POSTs results to `http://localhost:3000/api/import`.
5. **Sleep**: Waits 10-30s between queries to avoid bans.

## 3. Stopping and Resuming
- **Stop**: Press `Ctrl+C` or `kill` the process.
- **Resume**: Just run `./master_driver.py` again. It will automatically read `last_city_index.txt` and skip already processed cities.

## 4. Troubleshooting
- **Logs**: Check `logs/automation.log` for details.
- **Zombies**: If Chrome processes get stuck, the script attempts to kill them. You can manually run `pkill -f chromium`.
- **API Errors**: Ensure your Next.js app is running on port 3000.
