import { headline } from '../engine/narrative'
import type { Terms } from '../engine/terms'
import type { Analysis } from '../engine/types'
import './HeadlineBlock.css'

type Props = {
  analysis: Analysis
  terms: Terms
  sourceLabel: string
  isRevealed: boolean
  investigationId: string
  onToggle: () => void
}

export function HeadlineBlock({ analysis, terms, sourceLabel, isRevealed, investigationId, onToggle }: Props) {
  const { display, overall } = analysis
  return (
    <section className="headline page" aria-labelledby="headline-title">
      <p className="headline__eyebrow">{terms.eyebrow}</p>
      <h1 id="headline-title" className="headline__title">
        {headline(analysis, terms)}
      </h1>

      <div className="headline__figures">
        <p className="headline__rates num" aria-label={`Overall ${terms.metric}: ${display.previousRate} in the previous period, ${display.currentRate} in the current period`}>
          <span className="headline__rate">{display.previousRate}</span>
          <span className="headline__arrow" aria-hidden="true">→</span>
          <span className="headline__rate headline__rate--current">{display.currentRate}</span>
        </p>
        <p className="headline__caption">
          Overall {terms.metric}, previous period → current period ·{' '}
          <span className="num">
            {overall.previous.total.toLocaleString('en-US')} → {overall.current.total.toLocaleString('en-US')}
          </span>{' '}
          {terms.unit}
        </p>
        <p className="headline__source">{sourceLabel}</p>
      </div>

      <button
        type="button"
        className="headline__action"
        aria-expanded={isRevealed}
        aria-controls={investigationId}
        onClick={onToggle}
      >
        <span>{isRevealed ? 'Hide the investigation' : 'Look beneath the headline'}</span>
        <span className="headline__action-icon" aria-hidden="true">
          {isRevealed ? '↑' : '↓'}
        </span>
      </button>
    </section>
  )
}
