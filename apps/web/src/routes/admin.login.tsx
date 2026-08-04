import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Shield, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/site/ui-bits'

export const Route = createFileRoute('/admin/login')({
  component: AdminLogin,
})

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement admin auth here
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-purple/20 via-background to-background" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-purple/10 border border-neon-purple/30">
            <Shield className="h-8 w-8 text-neon-purple" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Admin Portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">Authorized staff only</p>
        </div>

        <Panel accent="purple" className="backdrop-blur-md bg-surface/80">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Staff Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-md border border-border bg-background/50 py-2 pl-10 pr-4 text-sm text-foreground focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple"
                  placeholder="admin@hunter-academy.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-background/50 py-2 pl-10 pr-4 text-sm text-foreground focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" variant="neonPurple" className="w-full mt-4">
              Access Terminal
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  )
}
