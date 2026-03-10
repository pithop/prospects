import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const RESULTS_DIR = path.join(process.cwd(), 'data', 'results');

const deliveryKeywords = ['ubereats', 'deliveroo', 'just-eat', 'glovo', 'doordash', 'wolt'];

async function backfillDelivery() {
    console.log('🚀 Starting Robust Delivery Platform Backfill...');

    if (!fs.existsSync(RESULTS_DIR)) {
        console.error(`❌ Directory not found`);
        process.exit(1);
    }

    const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));
    let totalProspectsChecked = 0;
    const deliveryMapsUrls = new Set();
    const deliveryPlacesId = new Set();

    for (const filename of files) {
        const filePath = path.join(RESULTS_DIR, filename);
        try {
            const content = fs.readFileSync(filePath, 'utf8').trim();
            if (!content) continue;

            let data;
            try {
                data = JSON.parse(content);
            } catch (e) {
                data = content.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
            }

            for (const it of data) {
                totalProspectsChecked++;

                // Robust check: convert the entire prospect object back to a string and search it.
                // This guarantees we don't miss platforms hidden deep in 'order_online' arrays, 'menu' objects, or descriptions.
                const prospectStr = JSON.stringify(it).toLowerCase();
                let hasDelivery = deliveryKeywords.some(kw => prospectStr.includes(kw));

                if (hasDelivery) {
                    let mapUrl = it.google_maps_url || it.link || it.url || it.map_url;

                    if (mapUrl) {
                        // Keep URL < 510 length just in case
                        const truncatedUrl = mapUrl.length > 510 ? mapUrl.substring(0, 510) : mapUrl;
                        deliveryMapsUrls.add(truncatedUrl);
                    }
                }
            }
        } catch (e) { }
    }

    console.log(`\n🔍 Scanned ${totalProspectsChecked} total prospects.`);
    console.log(`🛵 Found ${deliveryMapsUrls.size} unique prospects using delivery apps.`);

    if (deliveryMapsUrls.size === 0) {
        console.log('No updates needed. Exiting.');
        return;
    }

    console.log(`\n📡 Updating Supabase database in ultra-safe batches...`);

    let updatedCount = 0;
    const BATCH_SIZE = 50; // Reduced batch size to prevent API 400 Bad Request

    // 2. Update by Map URL (Fallback)
    const urlsArray = Array.from(deliveryMapsUrls);
    for (let i = 0; i < urlsArray.length; i += BATCH_SIZE) {
        const batch = urlsArray.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
            .from('prospects')
            .update({ has_delivery_app: true })
            .in('google_maps_url', batch)
            .select('id');

        if (error) {
            console.error(`❌ Batch error (Map URL):`, error.message);
        } else {
            updatedCount += (data ? data.length : 0);
            process.stdout.write(`✅ Progress URL: Batch ${i / BATCH_SIZE + 1} / ${Math.ceil(urlsArray.length / BATCH_SIZE)}\r`);
        }
    }

    console.log(`\n\n🎉 Backfill Complete! Successfully updated ~${updatedCount} records in the remote Supabase DB.`);
}

backfillDelivery().catch(console.error);
