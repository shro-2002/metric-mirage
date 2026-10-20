import { useEffect, useRef } from 'react'

import { headline } from '../engine/narrative'
import type { Terms } from '../engine/terms'
import type { Analysis } from '../engine/types'
import './HeadlineBlock.css'

type Props = {
  /** Increments when the data source changes; focus then moves to the new headline. */
  sourceVersion: number
  analysis: Analysis
  terms: Terms
  sourceLabel: string
  isRevealed: boolean
  investigationId: string
  onToggle: () => void
}

export function HeadlineBlock({ sourceVersion, analysis, terms, sourceLabel, isRevealed, investigationId, onToggle }: Props) {
  const { display, overall } = analysis
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (sourceVersion === 0) return
    titleRef.current?.focus({ preventScroll: true })
    titleRef.current?.scrollIntoView?.({ block: 'start' })
  }, [sourceVersion])
  return (
    <section className="headline page" aria-labelledby="headline-title">
      <div className="headline__top">
        <div>
          <p className="headline__eyebrow">{terms.eyebrow}</p>
          <h1 id="headline-title" ref={titleRef} tabIndex={-1} className="headline__title">
            {headline(analysis, terms)}
          </h1>
        </div>
        <p className="headline__dek">{terms.dek}</p>
      </div>

      <div className="headline__figures" id="headline-figures">
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
      <p className="headline__alt">
        or <a href="#your-data">analyze your own CSV</a>
      </p>
    </section>
  )
}
