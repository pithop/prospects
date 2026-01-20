# 📘 ProspectHub - Project Handoff Documentation (v1.0)

## 🚀 Project Overview
**Goal:** Automated Lead Generation & CRM System for a Digital Agency targeting French businesses.
**Core Function:** Scrapes Google Maps for prospects (restaurants, etc.) across all 35,000+ French communes, stores them in a database, and provides a "Premium" CRM interface for qualification.

## 🛠️ Technical Stack
- **OS:** Linux (Ubuntu/Debian)
- **Frontend:** Next.js 14, Tailwind CSS, Lucide React, Hello Pangea DnD.
- **Backend:** Next.js API Routes (`pages/api/*`).
- **Database:** Supabase (PostgreSQL).
- **Scraping Engine:** `gosom` (Go binary) orchestrated by Python (`master_driver.py`).
- **Language:** JavaScript (App), Python (Automation), Go (Scraper Core).

---

## ⚙️ Architecture & Data Flow

### 1. The Scraping Engine (`master_driver.py`)
This is the "Brain" of the data acquisition. It runs on the user's machine.
*   **Input:** `data/communes.csv` (List of all French cities).
*   **State Tracking:** Uses `last_city_index.txt` to remember where it stopped. It is crash-resilient.
*   **Loop:**
    1.  Reads the next city from CSV.
    2.  Constructs a query (e.g., "Restaurant à [City]").
    3.  Executes `./scraper-app` (the `gosom` binary) with reduced concurrency (`-c 8`) to avoid timeouts.
    4.  Parses the JSON output.
    5.  **Uploads to API:** Sends a POST request to `http://localhost:3000/api/import` with `x-secret-key`.
    6.  **Cleanup:** Kills any zombie Chrome processes.

### 2. The API Layer (`pages/api/`)
*   **`import.js`**: Receives data from the python script. Validates the `x-secret-key`. Inserts data into Supabase `prospects` table. Handles duplicates using `ON CONFLICT DO NOTHING`.
*   **`prospects.js`**: Main endpoint for the CRM.
    *   **GET**: Supports server-side filtering (`?city=Paris`), searching, and pagination (`limit`, `offset`).
    *   **PUT**: Updates prospect status (Kanban moves) or details.
*   **`cities.js`**: Returns a list of unique cities for the filter dropdown. Includes **strict filtering** to remove garbage data (numbers, business names misclassified as cities).

### 3. The Database (Supabase)
*   **Table:** `prospects`
*   **Key Columns:**
    *   `id`: Primary Key.
    *   `status`: 'nouveau', 'contacted', 'interested', 'signed'.
    *   `is_prospect_to_contact`: Boolean (True if no website or weak digital presence).
    *   `city`: The filtering key.
    *   `google_maps_url`, `rating`, `reviews`.
    *   `address`: Added recently for "Deep Research".

---

## 💻 Frontend Features

### 1. The CRM Board (`pages/crm.js`)
A "Trello-like" Kanban board for managing leads.
*   **Performance:**
    *   **Server-Side Filtering:** Leads are fetched by City. The UI does *not* load all 50k leads at once.
    *   **Virtualization Strategy:** Renders top 40 cards per column + "Load More" button to prevent DOM lag.
    *   **Optimized Components:** `CRMCard.js` is memoized and CSS effects (blur) are reduced for performance.
*   **Visuals:** "Award-Winning" dark mode, glassmorphism, animated gradients, custom scrollbars.
*   **Features:** Drag-to-move, real-time status updates, "Deep Research" modal.

### 2. AI & Enrichment
*   **AI Roast (`EmailGenerator.js`)**:
    *   Generates cold emails based on prospect data (bad rating? no website?).
    *   Templates: "Roast" (Aggressive), "Audit" (Helpful), "Network".
*   **Deep Research (`ProspectList.js`)**:
    *   Generates a complex prompt for ChatGPT/Gemini to analyze a specific lead.
    *   **Localized**: The prompt is fully translated into **French** ("Bilan de Santé Numérique", etc.).

---

## 🚧 Current State & Known Issues

1.  **Garbage City Data:** The scraper sometimes captures "Sushi Bar 75011" as a city.
    *   *Fix Implemented:* `pages/api/cities.js` has a regex filter to exclude these from the dropdown. They still exist in the DB but are hidden from UI.
2.  **Scraper Timeouts:** Occasionally `gosom` times out on very large cities or bad connections. `master_driver.py` has retry logic but can still fail.
3.  **Permissions:** The repo is local. `git status` shows uncommitted changes (User was advised to commit).

## 🔮 Next Steps (For the New Agent)
1.  **Bulk Export:** The user wants to select multiple leads and export to CSV (e.g., for Lemlist/Instantly).
2.  **Scraper Logic:** Investigate why "Sushi Bar" enters the City field (likely parsing error in `gosom` config or Python script).
3.  **Dashboard Sync:** Ensure the Main Dashboard (`pages/index.js`) reflects status changes made in the CRM.

## 📂 Key File Locations
*   `master_driver.py`: Python Automation Script.
*   `pages/crm.js`: The main Kanban App.
*   `pages/api/prospects.js`: The Data API.
*   `styles/globals.css`: The "Premium" Design System.
