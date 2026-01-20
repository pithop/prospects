const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '../data/results');
const API_URL = 'http://localhost:3000/api/import';
const SECRET_KEY = process.env.PROSPECTING_SECRET_KEY || 'my-secret-key-123'; // Fallback for safety

async function importFiles() {
    if (!fs.existsSync(RESULTS_DIR)) {
        console.error(`Directory not found: ${RESULTS_DIR}`);
        return;
    }

    const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} JSON files to import.`);

    for (const file of files) {
        const filePath = path.join(RESULTS_DIR, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const json = JSON.parse(content);

            // Determine items array
            let items = [];
            if (Array.isArray(json)) items = json;
            else if (json.items) items = json.items;
            else if (json.data) items = json.data;

            if (!items.length) {
                console.log(`Skipping empty file: ${file}`);
                continue;
            }

            console.log(`Importing ${items.length} records from ${file}...`);

            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-secret-key': SECRET_KEY
                },
                body: JSON.stringify({ items, city: file.split('_')[1] || 'Unknown' }) // Infer city from filename
            });

            if (res.ok) {
                const result = await res.json();
                console.log(`✅ Success: ${file} (${result.inserted} inserted)`);
            } else {
                const err = await res.text();
                console.error(`❌ Failed: ${file} - ${err}`);
            }

        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    }
}

importFiles();
