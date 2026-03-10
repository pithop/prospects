import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  console.log('Adding has_delivery_app column to prospects table...');
  const { error } = await supabase.rpc('execute_sql', { 
    query: "ALTER TABLE prospects ADD COLUMN IF NOT EXISTS has_delivery_app BOOLEAN DEFAULT FALSE;" 
  });
  
  if (error) {
    if (error.message.includes('function "execute_sql" does not exist')) {
        console.warn("RPC method not available. To update the database, please run this manually in the Supabase SQL Editor:");
        console.log("-----\nALTER TABLE prospects ADD COLUMN IF NOT EXISTS has_delivery_app BOOLEAN DEFAULT FALSE;\n-----");
    } else {
        console.error('Error:', error);
    }
  } else {
    console.log('Column added successfully.');
  }
}

addColumn();
