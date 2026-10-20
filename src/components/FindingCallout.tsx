import './FindingCallout.css'

type Props = {
  text: string
}

// Word joiner before an em dash so a line never starts with "—".
const keepDashAttached = (text: string) => text.replace(/ ?—/g, '⁠—')

export function FindingCallout({ text }: Props) {
  return (
    <p className="finding" data-testid="finding">
      {keepDashAttached(text)}
    </p>
  )
}
