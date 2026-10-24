import { useEffect, useRef, type CSSProperties } from 'react'

import { briefingSentences, decisionNote, explanation, finding, twoForces } from '../engine/narrative'
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

/** Color the two effect figures inside the "two forces" sentence to match the chart. */
function ForcesSentence({ analysis, terms }: { analysis: Analysis; terms: Terms }) {
  const text = twoForces(analysis, terms)
  const { rateEffect, compositionEffect } = analysis.display
  const rateTone = rateEffect.startsWith('+') ? 'improve' : rateEffect.startsWith('0') ? 'neutral' : 'decline'
  const first = text.indexOf(`(${rateEffect} points)`)
  const second = text.indexOf(`(${compositionEffect} points)`, first + 1)
  if (first < 0 || second < 0) return <>{text}</>
  const rateEnd = first + rateEffect.length + 1
  const compEnd = second + compositionEffect.length + 1
  return (
    <>
      {text.slice(0, first + 1)}
      <span className={`investigation__figure investigation__figure--${rateTone}`}>{rateEffect}</span>
      {text.slice(rateEnd, second + 1)}
      <span className="investigation__figure investigation__figure--composition">{compositionEffect}</span>
      {text.slice(compEnd)}
    </>
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
          <p className="investigation__forces" data-testid="two-forces">
            <ForcesSentence analysis={analysis} terms={terms} />
          </p>
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
