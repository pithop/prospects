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

function checkPlatform(linkStr) {
    if (!linkStr) return false;
    return deliveryKeywords.some(kw => linkStr.toLowerCase().includes(kw));
}

async function backfillDelivery() {
    console.log('🚀 Starting Delivery Platform Backfill...');
    console.log(`Scanning JSON files in: ${RESULTS_DIR}`);

    if (!fs.existsSync(RESULTS_DIR)) {
        console.error(`❌ Directory not found: ${RESULTS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} JSON files to process.`);

    let totalProspectsChecked = 0;
    // A Set to collect all maps URLs that have delivery platforms to bulk update later
    const deliveryMapsUrls = new Set();

    for (const filename of files) {
        const filePath = path.join(RESULTS_DIR, filename);
        try {
            const content = fs.readFileSync(filePath, 'utf8').trim();
            if (!content) continue;

            let data;
            try {
                data = JSON.parse(content);
            } catch (e) {
                // Handle JSONL format if any
                data = content.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
            }

            for (const it of data) {
                totalProspectsChecked++;
                let hasDelivery = false;

                const website = it.web_site || it.website || it.site || it.url || null;
                if (checkPlatform(website)) hasDelivery = true;

                if (it.order_online && Array.isArray(it.order_online)) {
                    it.order_online.forEach(orderLink => {
                        if (checkPlatform(orderLink.link) || checkPlatform(orderLink.source)) {
                            hasDelivery = true;
                        }
                    });
                }

                if (it.menu && it.menu.link && checkPlatform(it.menu.link)) {
                    hasDelivery = true;
                }

                const mapUrl = it.google_maps_url || it.link || it.url || it.map_url;
                if (hasDelivery && mapUrl) {
                    const truncatedUrl = mapUrl.length > 510 ? mapUrl.substring(0, 510) : mapUrl;
                    deliveryMapsUrls.add(truncatedUrl);
                }
            }
        } catch (e) {
            console.error(`Error processing ${filename}:`, e.message);
        }
    }

    console.log(`\n🔍 Scanned ${totalProspectsChecked} total prospects across JSON files.`);
    console.log(`🛵 Found ${deliveryMapsUrls.size} unique prospects using delivery apps.`);

    if (deliveryMapsUrls.size === 0) {
        console.log('No updates needed. Exiting.');
        return;
    }

    console.log(`\n📡 Updating Supabase database in batches...`);

    const urlsArray = Array.from(deliveryMapsUrls);
    const BATCH_SIZE = 100;
    let updatedCount = 0;

    for (let i = 0; i < urlsArray.length; i += BATCH_SIZE) {
        const batch = urlsArray.slice(i, i + BATCH_SIZE);

        // Using Supabase to update records where google_maps_url is in our batch
        const { data, error } = await supabase
            .from('prospects')
            .update({ has_delivery_app: true })
            .in('google_maps_url', batch)
            .select('id');

        if (error) {
            console.error(`❌ Batch update error:`, error.message);
        } else {
            updatedCount += (data ? data.length : 0);
            process.stdout.write(`✅ Progress: Processed batch ${i / BATCH_SIZE + 1} / ${Math.ceil(urlsArray.length / BATCH_SIZE)} (Updated ${data ? data.length : 0} records)\r`);
        }
    }

    console.log(`\n\n🎉 Backfill Complete! Successfully updated ~${updatedCount} records in Supabase.`);
    console.log(`(Note: The number of updated records might be slightly lower than ${deliveryMapsUrls.size} if some prospects aren't in Supabase yet).`);
}

backfillDelivery().catch(console.error);
