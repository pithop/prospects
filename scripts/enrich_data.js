const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '../data/results');
const API_URL = 'http://localhost:3000/api/prospects';
const SECRET_KEY = process.env.PROSPECTING_SECRET_KEY || 'my-secret-key-123';

async function enrichData() {
    console.log('🚀 Starting Data Enrichment (NDJSON Support)...');

    // 1. Fetch existing prospects (with Pagination)
    console.log('📥 Fetching existing prospects from DB...');
    let prospects = [];
    let offset = 0;
    const limit = 1000;
    let keepFetching = true;

    try {
        while (keepFetching) {
            console.log(` ... Fetching page offset ${offset}...`);
            const res = await fetch(`${API_URL}?limit=${limit}&offset=${offset}`, {
                headers: { 'x-secret-key': SECRET_KEY }
            });
            if (!res.ok) throw new Error(await res.text());

            const json = await res.json();
            const chunk = Array.isArray(json) ? json : (json.data || []);

            if (chunk.length === 0) {
                keepFetching = false;
            } else {
                // Safety Check: Detect if API is ignoring offset (Server not restarted)
                // If the first ID of this new chunk is the same as the first ID of the PREVIOUS chunk (or in our set), we are looping.
                // Ideally we just check if we've seen these IDs before.
                const firstId = chunk[0].id;
                if (prospects.some(p => p.id === firstId)) {
                    console.error("\n🛑 INFINITE LOOP DETECTED!");
                    console.error("The API is returning the same data repeatedly.");
                    console.error("👉 THIS MEANS YOU MUST RESTART YOUR NEXT.JS SERVER.");
                    console.error("1. Press Ctrl+C in the server terminal.");
                    console.error("2. Run 'npm run dev' again.");
                    process.exit(1);
                }

                prospects = prospects.concat(chunk);
                offset += limit;
                // If we got fewer than limit, we are done
                if (chunk.length < limit) keepFetching = false;

                // Absolute Safety brake
                if (offset > 100000) {
                    console.warn("⚠️ Reached safety limit of 100,000 items. Stopping script.");
                    keepFetching = false;
                }
            }
        }
        console.log(`✅ Found total ${prospects.length} prospects in DB.`);
    } catch (err) {
        console.error('❌ Failed to fetch prospects:', err.message);
        return;
    }

    // Create lookup map (Name -> ID)
    // Normalize names: lowercase, trim
    const prospectMap = new Map();
    prospects.forEach(p => {
        prospectMap.set(p.name.toLowerCase().trim(), p);
    });

    // 2. Iterate through JSON files
    if (!fs.existsSync(RESULTS_DIR)) {
        console.error(`Directory not found: ${RESULTS_DIR}`);
        return;
    }

    const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));
    console.log(`📂 Found ${files.length} JSON files to process.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        const filePath = path.join(RESULTS_DIR, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');

            // Attempt to parse as standard JSON first
            let items = [];
            try {
                const json = JSON.parse(content);
                if (Array.isArray(json)) items = json;
                else if (json.items) items = json.items;
                else if (json.data) items = json.data;
            } catch (e) {
                // If it fails, assume it is separate JSON objects per line (NDJSON)
                // console.log(`File ${file} is not a valid single JSON. Trying line-by-line...`);
                const lines = content.split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue; // Skip empty lines
                    try {
                        // Remove any potential leading line numbers inserted by view tools if copied blindly
                        // But usually raw file content is clean. Just parse.
                        items.push(JSON.parse(line));
                    } catch (lineErr) {
                        // console.warn(`Skipping invalid line in ${file}`);
                    }
                }
            }

            for (const item of items) {
                if (!item.title) continue;

                const normName = item.title.toLowerCase().trim();
                const dbProspect = prospectMap.get(normName);

                if (dbProspect) {
                    // Determine valid address
                    let addressVal = null;
                    if (item.complete_address && item.complete_address.street && item.complete_address.city) {
                        addressVal = `${item.complete_address.street}, ${item.complete_address.city}`;
                    } else if (item.address) {
                        addressVal = item.address;
                    }

                    // Check if update is needed
                    // Only update if DB is missing data AND we have new data
                    const needAddress = !dbProspect.address && addressVal;
                    const needUrl = !dbProspect.google_maps_url && item.link;
                    const needPopularTimes = !dbProspect.popular_times && item.popular_times;

                    let bestTimeVal = null;
                    if (item.popular_times) {
                        // Simple Algorithm: Find the weekday with lowest traffic between 10am-11am or 3pm-5pm
                        // We prefer Tuesday, Wednesday, Thursday to avoid rush
                        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                        let bestDay = '';
                        let lowestTraffic = 100;
                        let selectedSlot = '';

                        days.forEach(day => {
                            if (item.popular_times[day]) {
                                // Check morning slot (10-11)
                                const morningTraffic = item.popular_times[day]["10"] || 0;
                                // Check afternoon slot (15-16)
                                const afternoonTraffic = item.popular_times[day]["15"] || 0;

                                // We prefer afternoon if traffic is low, as managers are often less busy
                                if (afternoonTraffic < lowestTraffic && afternoonTraffic > 0) { // >0 means open
                                    lowestTraffic = afternoonTraffic;
                                    bestDay = day;
                                    selectedSlot = "15h (Afternoon)";
                                }

                                if (morningTraffic < lowestTraffic && morningTraffic > 0) {
                                    lowestTraffic = morningTraffic;
                                    bestDay = day;
                                    selectedSlot = "10h (Morning)";
                                }
                            }
                        });

                        if (bestDay) {
                            bestTimeVal = `${bestDay} around ${selectedSlot} (${lowestTraffic}% busy)`;
                        }
                    }

                    const needBestTime = !dbProspect.best_time_to_call && bestTimeVal;

                    if (needAddress || needUrl || needPopularTimes || needBestTime) {
                        // Update DB
                        const updates = { id: dbProspect.id };
                        if (needAddress) updates.address = addressVal;
                        if (needUrl) updates.google_maps_url = item.link;
                        if (needPopularTimes) updates.popular_times = item.popular_times;
                        if (needBestTime) updates.best_time_to_call = bestTimeVal;

                        const updateRes = await fetch(API_URL, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-secret-key': SECRET_KEY
                            },
                            body: JSON.stringify(updates)
                        });

                        if (updateRes.ok) {
                            console.log(`✅ Updated: ${item.title} (ID: ${dbProspect.id})`);
                            if (needBestTime) console.log(`   sched: ${bestTimeVal}`);
                            updatedCount++;
                            // Update local map to avoid redundant updates if duplicates exist in JSONs
                            if (needAddress) dbProspect.address = addressVal;
                            if (needUrl) dbProspect.google_maps_url = item.link;
                            if (needPopularTimes) dbProspect.popular_times = item.popular_times;
                            if (needBestTime) dbProspect.best_time_to_call = bestTimeVal;
                        } else {
                            console.error(`⚠️ Failed to update ${item.title}:`, await updateRes.text());
                        }
                    } else {
                        skippedCount++;
                    }
                }
            }

        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    }

    console.log(`\n🎉 Done!`);
    console.log(`- Updated: ${updatedCount}`);
    console.log(`- Skipped (Already up to date): ${skippedCount}`);
}

enrichData();
