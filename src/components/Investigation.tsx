import { useEffect, useRef, type CSSProperties } from 'react'

import { briefing, explanation, finding } from '../engine/narrative'
import { capitalize, type Terms } from '../engine/terms'
import type { Analysis } from '../engine/types'
import { BriefingCard } from './BriefingCard'
import { FindingCallout } from './FindingCallout'
import { SiteComparison } from './SiteComparison'
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

  useEffect(() => {
    const heading = headingRef.current
    if (!heading) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    heading.focus({ preventScroll: true })
    // Keep the headline's figures on screen so the investigation reads as what lies beneath them.
    const anchor = document.getElementById('headline-figures') ?? heading
    anchor.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [])

  return (
    <section id={id} className="investigation" aria-labelledby="investigation-title">
      <div className="page">
        <h2 id="investigation-title" ref={headingRef} tabIndex={-1} className="investigation__title" style={step(0)}>
          Beneath the headline
        </h2>

        <div className="investigation__step" style={step(1)}>
          <h3 className="investigation__subhead">
            <span className="investigation__number" aria-hidden="true">
              1
            </span>
            {capitalize(terms.groups)}, one by one
          </h3>
          <SiteComparison groups={analysis.groups} terms={terms} />
        </div>

        <div className="investigation__step investigation__step--finding" style={step(2)}>
          <FindingCallout text={finding(analysis, terms)} />
        </div>

        <div className="investigation__step" style={step(3)}>
          <h3 className="investigation__subhead">
            <span className="investigation__number" aria-hidden="true">
              2
            </span>
            Where the {analysis.display.net} points came from
          </h3>
          <Waterfall analysis={analysis} terms={terms} />
          <p className="investigation__explanation">{explanation(analysis, terms)}</p>
        </div>

        <div className="investigation__step" style={step(4)}>
          <h3 className="investigation__subhead">
            <span className="investigation__number" aria-hidden="true">
              3
            </span>
            What to report
          </h3>
          <BriefingCard text={briefing(analysis, terms)} />
        </div>
      </div>
    </section>
  )
}
