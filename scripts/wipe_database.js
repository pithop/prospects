require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function wipeDatabase() {
    console.log("⚠️  ATTENTION: Suppression de TOUS les prospects de la base de données...");

    // Pour vider une table rapidement via l'API, on supprime tout ce qui a un ID > 0
    const { error } = await supabase
        .from('prospects')
        .delete()
        .gt('id', 0);

    if (error) {
        console.error("❌ Erreur lors de la suppression:", error.message);
    } else {
        console.log("✅ Base de données remise à zéro ! Vous pouvez relancer le scraping.");
    }
}

wipeDatabase();
