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

# 4. Create Default Target Cities if missing
if [ ! -f "data/target_cities.csv" ]; then
    echo "Creating default data/target_cities.csv..."
    cat > data/target_cities.csv <<EOL
nom_commune_postal,code_postal
Paris,75001
Paris,75002
Paris,75003
Paris,75004
Paris,75005
Paris,75006
Paris,75007
Paris,75008
Paris,75009
Paris,75010
Paris,75011
Paris,75012
Paris,75013
Paris,75014
Paris,75015
Paris,75016
Paris,75017
Paris,75018
Paris,75019
Paris,75020
Marseille,13001
Marseille,13002
Marseille,13006
Marseille,13007
Marseille,13008
Lyon,69001
Lyon,69002
Lyon,69003
Lyon,69004
Lyon,69005
Lyon,69006
Toulouse,31000
Nice,06000
Nantes,44000
Montpellier,34000
Strasbourg,67000
Bordeaux,33000
Lille,59000
Rennes,35000
Reims,51100
Toulon,83000
Saint-Etienne,42000
Le Havre,76600
Grenoble,38000
Dijon,21000
Angers,49000
Villeurbanne,69100
Nimes,30000
Aix-en-Provence,13100
Clermont-Ferrand,63000
Le Mans,72000
Brest,29200
Tours,37000
Amiens,80000
Annecy,74000
Boulogne-Billancourt,92100
Saint-Denis,93200
Montreuil,93100
Argenteuil,95100
Rouen,76000
Mulhouse,68100
EOL
    echo "Default target cities created."
fi
