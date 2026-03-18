import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function RoomCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const inviteLink = `${window.location.origin}/room/${code}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-elevated rounded-[12px] border border-border-subtle p-[14px] flex flex-col gap-[8px]">
      {/* Label */}
      <span className="font-mono text-[10px] font-medium tracking-[1.5px] text-text-muted">
        CODE DE LA ROOM
      </span>

      {/* Code row */}
      <div className="flex items-center justify-between">
        <span className="font-display text-[28px] font-extrabold tracking-[6px] text-accent">
          {code}
        </span>
        <button
          onClick={copyLink}
          className="flex items-center justify-center bg-elevated rounded-[6px] px-[10px] py-[6px] hover:bg-border-subtle transition-colors"
        >
          {copied ? (
            <Check className="w-[14px] h-[14px] text-accent" />
          ) : (
            <Copy className="w-[14px] h-[14px] text-text-secondary" />
          )}
        </button>
      </div>

      {copied && (
        <span className="text-accent text-[11px] font-medium">Lien copie !</span>
      )}
    </div>
  )
}
