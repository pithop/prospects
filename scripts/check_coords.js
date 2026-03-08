require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    const { data, count } = await supabase
        .from('prospects')
        .select('id, name, city, latitude, longitude, google_maps_url')
        .ilike('city', '%Montpellier%');

    console.log(`Total Montpellier prospects: ${data.length}`);
    const withCoords = data.filter(d => d.latitude !== null);
    console.log(`With coordinates: ${withCoords.length}`);

    if (withCoords.length < 10) {
        console.log("Sample of google_maps_url without coords:");
        console.log(data.filter(d => d.latitude === null).slice(0, 5).map(d => d.google_maps_url));
    }
}
check();
