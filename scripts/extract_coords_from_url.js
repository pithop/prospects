require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
    console.log("🚀 Extraction ULTRA-RAPIDE des vraies coordonnées depuis les liens Google Maps...");

    let processed = 0;
    let updated = 0;
    let lastId = 0;

    while (true) {
        // On récupère par lots de 1000 pour aller très vite
        const { data: prospects, error } = await supabase
            .from('prospects')
            .select('id, name, google_maps_url, latitude')
            .gt('id', lastId)
            .order('id', { ascending: true })
            .limit(1000);

        if (error) {
            console.error("\n❌ Erreur Supabase:", error.message);
            break;
        }

        if (!prospects || prospects.length === 0) {
            console.log(`\n\n✅ Terminé ! (${updated} profils mis à jour avec des coordonnées EXACTES)`);
            break;
        }

        // Pour grouper les mises à jour et faire moins de requêtes
        const updates = [];

        for (const p of prospects) {
            processed++;
            lastId = p.id;

            if (p.google_maps_url) {
                let lat = null;
                let lng = null;

                // Cherche le pattern: @latitude,longitude
                let match = p.google_maps_url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (match) {
                    lat = parseFloat(match[1]);
                    lng = parseFloat(match[2]);
                } else {
                    // Cherche le pattern: !3dlatitude!4dlongitude
                    match = p.google_maps_url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                    if (match) {
                        lat = parseFloat(match[1]);
                        lng = parseFloat(match[2]);
                    }
                }

                if (lat !== null && lng !== null) {
                    // Est-ce qu'on a besoin de le mettre à jour ?
                    if (p.latitude !== lat) {
                        const { error: updateError } = await supabase
                            .from('prospects')
                            .update({ latitude: lat, longitude: lng })
                            .eq('id', p.id);

                        if (!updateError) updated++;
                    }
                }
            }
        }
        process.stdout.write(`\r⏳ Progression: ${processed} analysés, ${updated} corrigés avec succès...`);
    }
}

main();
