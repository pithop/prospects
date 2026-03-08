require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper to pause execution (Nominatim allows max 1 request per second)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAddress(address, city) {
    // Construct search query
    let query = '';
    if (address) query += address + ', ';
    if (city) query += city;

    if (!query) return null;

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'ProspectHub-BackfillBot/1.0',
                'Accept-Language': 'fr'
            }
        });

        const data = await res.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (error) {
        console.error(`- Erreur de géocodage pour "${query}":`, error.message);
    }
    return null;
}

async function main() {
    console.log("🚀 Lancement du script de backfill des coordonnées...");

    let processed = 0;
    let updated = 0;

    while (true) {
        // 1. Get prospects without coordinates
        const { data: prospects, error } = await supabase
            .from('prospects')
            .select('id, name, address, city')
            .is('latitude', null)
            .limit(50); // Fetch in batches

        if (error) {
            console.error("❌ Erreur Supabase:", error.message);
            break;
        }

        if (!prospects || prospects.length === 0) {
            console.log(`\n✅ Terminé ! Tous les prospects ont été scannés. (${updated} mis à jour au total)`);
            break;
        }

        console.log(`\n⏳ Traitement d'un lot de ${prospects.length} prospects...`);

        for (const p of prospects) {
            processed++;
            console.log(`[${processed}] Recherche pour: ${p.name} (${p.city || 'Ville inconnue'})`);

            // Try to get coordinates using address + city, or just city if no address
            let coords = await geocodeAddress(p.address, p.city);

            // If address fails, try just the city to at least have them on the map loosely
            if (!coords && p.address && p.city) {
                await sleep(1500); // Wait again
                console.log(`  -> Adresse précise introuvable, tentative avec la ville seule...`);
                coords = await geocodeAddress(null, p.city);
            }

            if (coords) {
                // Update database
                const { error: updateError } = await supabase
                    .from('prospects')
                    .update({ latitude: coords.lat, longitude: coords.lng })
                    .eq('id', p.id);

                if (updateError) {
                    console.error(`❌ Erreur MAJ pour ${p.id}:`, updateError.message);
                } else {
                    updated++;
                    console.log(`  ✅ OK: [${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}]`);
                }
            } else {
                console.log(`  ❌ Introuvable. On passe au suivant.`);
                // Mark them with a special value so they aren't processed forever?
                // Simple trick: Set latitude=0 to mean "processed but not found"
                await supabase.from('prospects').update({ latitude: 0, longitude: 0 }).eq('id', p.id);
            }

            // MANDATORY: Wait 1.5s between requests to respect Nominatim Terms of Service
            await sleep(1500);
        }
    }
}

main();
