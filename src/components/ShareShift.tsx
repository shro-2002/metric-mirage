import type { CSSProperties } from 'react'

import { add, sign, sub, toNumber } from '../engine/rational'
import { capitalize, type Terms } from '../engine/terms'
import type { GroupResult } from '../engine/types'
import { Arrow } from './Arrow'
import './ShareShift.css'

type Props = {
  groups: GroupResult[]
  terms: Terms
}

const DARK = [47, 56, 120] // #2f3878
const LIGHT = [216, 218, 238] // #d8daee
const LABEL_MIN_SHARE = 0.11
const NARROW_SHARE = 0.2 // labels hidden on phones below this width share
const PAPER_TEXT_MAX_LUMINANCE = 0.165 // paper #faf6ee ≥ 4.5:1 below this
const INK_TEXT_MIN_LUMINANCE = 0.25 // ink #1b2430 ≥ 4.5:1 above this

const mix = (t: number) => DARK.map((d, i) => Math.round(d + (LIGHT[i]! - d) * t))
const relativeLuminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

/**
 * Share of the total in each period, as two 100% bars with exact widths.
 * Groups run from highest to lowest average rate (darkest = highest), so a
 * shift toward stronger groups shows as the dark end widening.
 * Decorative bars; the list below carries the same numbers as text.
 */
export function ShareShift({ groups, terms }: Props) {
  const ordered = [...groups].sort((a, b) =>
    sign(sub(add(b.previous.rate, b.current.rate), add(a.previous.rate, a.current.rate))),
  )
  const colors = ordered.map((_, i) => {
    const rgb = mix(ordered.length === 1 ? 0 : i / (ordered.length - 1))
    // In-bar labels only where AA (4.5:1) is guaranteed: paper text on dark, ink text on light.
    // Mid-tones can't reach 4.5:1 with either, so they rely on the text legend.
    const l = relativeLuminance(rgb)
    const text = l <= PAPER_TEXT_MAX_LUMINANCE ? 'var(--paper)' : l >= INK_TEXT_MIN_LUMINANCE ? 'var(--ink)' : null
    return { fill: `rgb(${rgb.join(' ')})`, text }
  })

  const bar = (period: 'previous' | 'current') => (
    <div className="shares__bar" aria-hidden="true">
      {ordered.map((g, i) => {
        const share = toNumber(g[period].share)
        const { fill, text } = colors[i]!
        const style = { '--share': `${share * 100}%`, background: fill, color: text ?? undefined } as CSSProperties
        return (
          <span key={g.name} className={`shares__segment${share < NARROW_SHARE ? ' shares__segment--narrow' : ''}`} style={style}>
            {share >= LABEL_MIN_SHARE && text && (
              <>
                <span className="shares__name">{g.name}</span>
                <span className="shares__pct num">{period === 'previous' ? g.display.previousShare : g.display.currentShare}</span>
              </>
            )}
          </span>
        )
      })}
    </div>
  )

  return (
    <figure className="shares">
      <figcaption className="shares__caption">
        Where the {terms.unit} were: share of {terms.shareOf} by {terms.group}
      </figcaption>
      <div className="shares__row">
        <span className="shares__period">Previous</span>
        {bar('previous')}
      </div>
      <div className="shares__row">
        <span className="shares__period">Current</span>
        {bar('current')}
      </div>
      <p className="shares__key">
        Darker = higher {terms.metric}. {capitalize(terms.groups)} are ordered from highest to lowest.
      </p>
      <ul className="shares__legend">
        {ordered.map((g, i) => (
          <li key={g.name}>
            <span className="shares__swatch" style={{ background: colors[i]!.fill }} aria-hidden="true" />
            <span className="shares__legend-name">{g.name}</span>{' '}
            <span className="num">
              share {g.display.previousShare} <Arrow /> {g.display.currentShare}
            </span>
            <span className="shares__legend-rate num">
              {' '}
              · {terms.metric} {g.display.previousRate} <Arrow /> {g.display.currentRate}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
