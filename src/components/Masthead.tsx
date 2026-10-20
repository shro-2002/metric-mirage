import './Masthead.css'

export function Masthead() {
  return (
    <header className="masthead page">
      <p className="masthead__wordmark">
        <span aria-hidden="true" className="masthead__mark" />
        Metric Mirage
      </p>
      <p className="masthead__tagline">Before you report that number.</p>
    </header>
  )
}
