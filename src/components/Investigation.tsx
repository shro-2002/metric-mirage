import { useEffect, useRef, type CSSProperties } from 'react'

import { briefingSentences, explanation, finding } from '../engine/narrative'
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

const step = (index: number) => ({ '--step': index }) as CSSProperties

/** Mounted only after "Look beneath the headline"; moves focus to its heading on arrival. */
export function Investigation({ id, analysis, terms }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const heading = headingRef.current
    if (!heading) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    heading.focus({ preventScroll: true })
    // Prefer keeping the headline's figures in view above the finding and comparison, so the
    // discovery reads as what lies beneath the same number. If both can't fit (small screens),
    // bring the investigation to the top; its "Overall" row still carries the headline figure.
    const figures = document.getElementById('headline-figures')
    const summary = summaryRef.current
    const fitsTogether =
      figures && summary
        ? summary.getBoundingClientRect().bottom - figures.getBoundingClientRect().top <= window.innerHeight - 16
        : false
    const anchor = fitsTogether && figures ? figures : heading
    anchor.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [])

  return (
    <section id={id} className="investigation" aria-labelledby="investigation-title">
      <div className="page">
        <h2 id="investigation-title" ref={headingRef} tabIndex={-1} className="investigation__title" style={step(0)}>
          Beneath the headline
        </h2>

        <div className="investigation__lead" style={step(1)} ref={summaryRef}>
          <FindingCallout text={finding(analysis, terms)} />
          <ChangeSummary analysis={analysis} terms={terms} />
        </div>

        <div className="investigation__step" style={step(2)}>
          <h3 className="investigation__subhead">
            <span className="investigation__number" aria-hidden="true">
              1
            </span>
            {capitalize(terms.groups)}, one by one
          </h3>
          <SiteComparison groups={analysis.groups} terms={terms} />
        </div>

        <div className="investigation__step" style={step(3)}>
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

        <div className="investigation__step" style={step(4)}>
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
