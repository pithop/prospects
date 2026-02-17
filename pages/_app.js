import '@/styles/globals.css'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default function App({ Component, pageProps }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session && router.pathname !== '/login') {
                router.push('/login')
            } else if (session && router.pathname === '/login') {
                router.push('/')
            }
            setLoading(false)
        }

        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!session && router.pathname !== '/login') {
                router.push('/login')
            }
        })

        return () => subscription.unsubscribe()
    }, [router.pathname])

    if (loading) {
        // Simple loading spinner for auth check
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#050505] text-indigo-500">
                <svg className="animate-spin h-10 w-10" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        )
    }

    return <Component {...pageProps} />
}
