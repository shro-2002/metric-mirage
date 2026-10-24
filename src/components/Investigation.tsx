import { useEffect, useRef, type CSSProperties } from 'react'

import { briefingSentences, decisionNote, explanation, finding, forces, type ForceKey } from '../engine/narrative'
import { capitalize, type Terms } from '../engine/terms'
import type { Analysis } from '../engine/types'
import { BriefingCard } from './BriefingCard'
import { ChangeSummary } from './ChangeSummary'
import { FindingCallout } from './FindingCallout'
import { SiteComparison } from './SiteComparison'
import { ShareShift } from './ShareShift'
import { Waterfall } from './Waterfall'
import './Investigation.css'

type Props = {
  id: string
  analysis: Analysis
  terms: Terms
}

const TONE: Record<string, string> = { '+': 'improve', '0': 'neutral' }
const toneOf = (key: ForceKey, value: string): string =>
  key === 'composition' ? 'composition' : key === 'net' ? 'net' : (TONE[value[0]!] ?? 'decline')

/** The "why" in three scannable steps; the effect size of each sits apart from its words. */
function Forces({ analysis, terms }: { analysis: Analysis; terms: Terms }) {
  return (
    <ol className="forces" data-testid="forces">
      {forces(analysis, terms).map((f) => (
        <li key={f.key} className={`forces__item forces__item--${f.key}`}>
          <span className="forces__label">{f.label}</span>
          <span className={`forces__value num investigation__figure investigation__figure--${toneOf(f.key, f.value)}`}>
            {f.value}
            <span className="visually-hidden"> percentage points</span>
            <span aria-hidden="true" className="forces__unit">
              {' '}
              pp
            </span>
          </span>
          <p className="forces__text">{f.text}</p>
        </li>
      ))}
    </ol>
  )
}

const step = (index: number) => ({ '--step': index }) as CSSProperties

/** Mounted only after "Look beneath the headline"; moves focus to its heading on arrival. */
export function Investigation({ id, analysis, terms }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const heading = headingRef.current
    if (!heading) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    heading.focus({ preventScroll: true })
    // Bring the discovery to the top of the viewport. The headline figure stays on screen as
    // the "Overall" row of the comparison, so the context is kept without the hero above it.
    heading.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [])

  return (
    <section id={id} className="investigation" aria-labelledby="investigation-title">
      <div className="page">
        <h2 id="investigation-title" ref={headingRef} tabIndex={-1} className="investigation__title" style={step(0)}>
          Beneath the headline
        </h2>

        <div className="investigation__lead" style={step(1)}>
          <FindingCallout text={finding(analysis, terms)} />
          <ChangeSummary analysis={analysis} terms={terms} />
        </div>

        <div className="investigation__why" style={step(2)}>
          <Forces analysis={analysis} terms={terms} />
          <aside className="investigation__decision" aria-label="What this means for the decision">
            <p className="investigation__decision-label">What this means for the decision</p>
            <p data-testid="decision-note">{decisionNote(analysis, terms)}</p>
          </aside>
        </div>

        <div className="investigation__step" style={step(3)}>
          <h3 className="investigation__subhead">
            <span className="investigation__number" aria-hidden="true">
              1
            </span>
            {capitalize(terms.groups)}, one by one
          </h3>
          <SiteComparison groups={analysis.groups} terms={terms} />
        </div>

        <div className="investigation__step" style={step(4)}>
          <h3 className="investigation__subhead">
            <span className="investigation__number" aria-hidden="true">
              2
            </span>
            Where the {analysis.display.net} points came from
          </h3>
          <Waterfall analysis={analysis} terms={terms} />
          <ShareShift groups={analysis.groups} terms={terms} />
          <p className="investigation__explanation">{explanation(analysis, terms)}</p>
        </div>

        <div className="investigation__step" style={step(5)}>
          <h3 className="investigation__subhead">
            <span className="investigation__number" aria-hidden="true">
              3
            </span>
            What to report
          </h3>
          <BriefingCard sentences={briefingSentences(analysis, terms)} />
        </div>
      </div>
    </section>
  )
}
