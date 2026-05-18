import { createClient } from '@supabase/supabase-js'
import ClientView from './ClientView'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Force dynamic rendering to always fetch fresh data from Supabase
export const dynamic = 'force-dynamic'

export default async function ProspectsV2Page() {
  const { data: prospects, error } = await supabase
    .from('prospects_v2')
    .select('*')
    .order('last_enriched_at', { ascending: false })

  if (error) {
    console.error("Error fetching prospects_v2:", error)
    return (
      <div className="min-h-screen bg-[#0b1120] p-8 text-red-500">
        <h1 className="text-2xl font-bold mb-4">Error loading prospects</h1>
        <p>{error.message}</p>
        <p className="mt-4 text-sm text-slate-400">Did you create the prospects_v2 table in Supabase?</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-300">
      <div className="max-w-7xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ProspectHub V2</h1>
          <p className="text-slate-400">
            Cible : Restaurants UberEats sans site web indépendant.
          </p>
        </header>

        {/* Pass the server-fetched data to the interactive client component */}
        <ClientView initialProspects={prospects || []} />
      </div>
    </div>
  )
}
