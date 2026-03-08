require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanBadCoords() {
    console.log("🧹 Nettoyage des coordonnées imprécises (celles au mètre près identiques au centre de la ville)...");

    // Coordonnées approximatives souvent renvoyées par OpenStreetMap quand on cherche juste une ville
    const knownBadCoords = [
        { city: 'Aix-En-Provence', lat: 43.5298, lng: 5.4475 },
        { city: 'Marseille', lat: 43.2965, lng: 5.3698 }, // Approx.
        { city: 'Paris', lat: 48.8566, lng: 2.3522 },
        // On va plutôt chercher tous les doublons exacts massifs qui prouvent une imprécision
    ];

    // Solution universelle : on cherche les prospects qui ont *exactement* les mêmes coordonnées
    // qu'au moins 10 autres dans la même ville, ce qui est impossible dans la vraie vie
    const { data: prospects, error } = await supabase
        .from('prospects')
        .select('id, city, latitude, longitude')
        .not('latitude', 'is', null);

    if (error) {
        console.error("Erreur:", error.message);
        return;
    }

    // Grouper par coordonnées
    const coordGroups = {};
    for (const p of prospects) {
        // Arrondir un peu pour attraper les micro-variations de l'API OpenStreetMap
        const key = `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`;
        if (!coordGroups[key]) coordGroups[key] = [];
        coordGroups[key].push(p.id);
    }

    let idsToReset = [];
    for (const [coord, ids] of Object.entries(coordGroups)) {
        // Si plus de 5 restaurants partagent EXACTEMENT au mètre près la même coordonnée, c'est une fausse coordonnée de centre-ville
        if (ids.length > 5) {
            console.log(`📍 Coordonnée suspecte trouvée (${coord}) avec ${ids.length} prospects !`);
            idsToReset.push(...ids);
        }
    }

    console.log(`\n🗑️ ${idsToReset.length} prospects ont des positions génériques (fausses). Suppression de ces coordonnées...`);

    if (idsToReset.length > 0) {
        // Mise à jour par lots pour ne pas faire crasher l'API
        const chunkSize = 500;
        for (let i = 0; i < idsToReset.length; i += chunkSize) {
            const chunk = idsToReset.slice(i, i + chunkSize);
            const { error: resetError } = await supabase
                .from('prospects')
                .update({ latitude: null, longitude: null })
                .in('id', chunk);

            if (resetError) {
                console.error("Erreur de reset:", resetError.message);
            } else {
                console.log(`✅ Nettoyé ${chunk.length} prospects...`);
            }
        }
    }

    console.log("\n✨ Terminé. Il ne reste plus en base que les vraies coordonnées isolées.");
}

cleanBadCoords();
