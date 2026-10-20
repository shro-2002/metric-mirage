import './FindingCallout.css'

type Props = {
  text: string
}

export function FindingCallout({ text }: Props) {
  return (
    <p className="finding" data-testid="finding">
      {text}
    </p>
  )
}
