import { useState } from 'react'
import { Check, Link } from 'lucide-react'

export default function RoomCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const inviteLink = `${window.location.origin}/room/${code}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="gradient-border">
      <div className="p-6 text-center">
        <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Code de la room</p>
        <p className="font-display text-5xl tracking-[0.3em] text-neon-green text-glow-green mb-4">
          {code}
        </p>
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary bg-surface-light px-4 py-2 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-neon-green" />
              <span className="text-neon-green">Lien copie !</span>
            </>
          ) : (
            <>
              <Link className="w-4 h-4" />
              <span>Copier le lien d'invitation</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
