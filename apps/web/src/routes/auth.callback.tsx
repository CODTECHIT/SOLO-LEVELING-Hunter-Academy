import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useServerFn } from '@tanstack/react-start'
import { syncSupabaseOAuthUserFn } from '@/server/auth'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackComponent,
})

function AuthCallbackComponent() {
  const navigate = useNavigate()
  const syncUser = useServerFn(syncSupabaseOAuthUserFn)
  const [status, setStatus] = useState("Verifying authentication...")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setStatus("Syncing account details...")
        const email = session.user.email
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User"
        
        if (email) {
          syncUser({ data: { email, name } })
            .then(() => {
              navigate({ to: '/dashboard' })
            })
            .catch((err) => {
              console.error(err)
              setStatus("Failed to sync account.")
            })
        } else {
           setStatus("No email found in OAuth provider.")
        }
      } else {
        setStatus("Authentication failed or session missing.")
      }
    })
  }, [navigate, syncUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="p-8 border border-zinc-800 rounded-xl bg-zinc-900/50 flex flex-col items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4" />
        <p>{status}</p>
      </div>
    </div>
  )
}
