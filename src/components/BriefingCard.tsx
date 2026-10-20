import { useEffect, useRef, useState } from 'react'

import './BriefingCard.css'

type Props = {
  text: string
}

type CopyState = 'idle' | 'copied' | 'manual'

const STATUS: Record<CopyState, string> = {
  idle: '',
  copied: 'Copied. Paste it into your report.',
  manual: 'Copying is blocked here, so the text is selected. Press Ctrl+C (or ⌘C) to copy it.',
}

const RESET_AFTER_MS = 4000

export function BriefingCard({ text }: Props) {
  const [state, setState] = useState<CopyState>('idle')
  const textRef = useRef<HTMLParagraphElement>(null)

  // A new briefing (e.g. after uploading data) starts with no stale "Copied" message.
  useEffect(() => setState('idle'), [text])

  useEffect(() => {
    if (state !== 'copied') return
    const timer = window.setTimeout(() => setState('idle'), RESET_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [state])

  const selectText = () => {
    const node = textRef.current
    const selection = window.getSelection()
    if (!node || !selection) return
    const range = document.createRange()
    range.selectNodeContents(node)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      // Permission denied or insecure context: fall back to a selection the user can copy.
      selectText()
      setState('manual')
    }
  }

  return (
    <div className="briefing">
      <p className="briefing__label">For your report</p>
      <p ref={textRef} className="briefing__text" data-testid="briefing">
        {text}
      </p>
      <div className="briefing__actions">
        <button type="button" className="briefing__copy" onClick={handleCopy}>
          Copy briefing
        </button>
        <p className="briefing__status" role="status" aria-live="polite">
          {STATUS[state]}
        </p>
      </div>
    </div>
  )
}
