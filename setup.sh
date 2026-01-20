#!/bin/bash

# Zero-Touch Prospecting Bot Setup Script
# Run this from the project root (/home/idriss/prospects)

echo "Starting environment setup..."

# 1. Create Directories
echo "Creating data and logs directories..."
mkdir -p data
mkdir -p logs
mkdir -p data/results

# 2. Download gosom Binary
echo "Downloading gosom binary (v1.10.0)..."
# Using the specific release as per report
wget -q --show-progress https://github.com/gosom/google-maps-scraper/releases/download/v1.10.0/google_maps_scraper-1.10.0-linux-amd64 -O scraper-app

if [ -f "scraper-app" ]; then
    echo "Binary downloaded successfully."
    chmod +x scraper-app
else
    echo "Error: Failed to download gosom binary."
    exit 1
fi

# 3. Download French Communes CSV
echo "Downloading French Communes CSV..."
wget -q --show-progress -O data/communes.csv https://www.data.gouv.fr/fr/datasets/r/dbe8a621-a9c4-4bc3-9cae-be1699c5ff25

if [ -f "data/communes.csv" ]; then
    echo "CSV downloaded successfully."
else
    echo "Error: Failed to download CSV."
    exit 1
fi

echo "Setup complete! You can now run the master driver."
