import type { CSSProperties } from 'react'

import { toNumber } from '../engine/rational'
import { capitalize, type Terms } from '../engine/terms'
import { toPoints } from '../engine/format'
import type { Analysis, Direction } from '../engine/types'
import './ChangeSummary.css'

type Props = {
  analysis: Analysis
  terms: Terms
}

const MAX_LISTED_GROUPS = 10
const GLYPH: Record<Direction, string> = { up: '▲', down: '▼', unchanged: '●' }
const WORD: Record<Direction, string> = { up: 'up', down: 'down', unchanged: 'unchanged' }

type Row = { key: string; label: string; value: string; points: number; direction: Direction; isOverall: boolean }

/**
 * The overall change beside each group's change, on one shared zero-centred
 * scale (same units, same scale for every bar, so nothing is exaggerated).
 */
export function ChangeSummary({ analysis, terms }: Props) {
  const overall: Row = {
    key: 'overall',
    label: `Overall ${terms.metric}`,
    value: analysis.display.net,
    points: analysis.decompositionPoints.net,
    direction: analysis.overall.direction,
    isOverall: true,
  }
  const groups: Row[] = analysis.groups.map((g) => ({
    key: g.name,
    label: g.name,
    value: g.display.change,
    points: toNumber(toPoints(g.change)),
    direction: g.direction,
    isOverall: false,
  }))
  const listed = groups.length <= MAX_LISTED_GROUPS ? groups : []
  const scale = Math.max(...[overall, ...listed].map((r) => Math.abs(r.points)), Number.EPSILON)
  const up = groups.filter((g) => g.direction === 'up').length
  const down = groups.filter((g) => g.direction === 'down').length

  return (
    <div className="summary" data-testid="change-summary">
      <ul className="summary__rows">
        {[overall, ...listed].map((row) => {
          const width = (Math.abs(row.points) / scale) * 50
          const style = { '--width': `${width}%` } as CSSProperties
          return (
            <li key={row.key} className={`summary__row summary__row--${row.direction}${row.isOverall ? ' summary__row--overall' : ''}`}>
              <span className="summary__label">{row.label}</span>
              <span className="summary__track" aria-hidden="true">
                <span className="summary__bar" style={style} />
              </span>
              <span className="summary__value num">
                <span aria-hidden="true" className="summary__glyph">
                  {GLYPH[row.direction]}
                </span>
                {row.value}
                <span className="visually-hidden"> points, {WORD[row.direction]}</span>
                <span aria-hidden="true" className="summary__unit">
                  {' '}
                  pp
                </span>
              </span>
            </li>
          )
        })}
      </ul>
      {listed.length === 0 && (
        <p className="summary__tally">
          Across {groups.length} {terms.groups}: {up} rose, {down} fell, {groups.length - up - down} unchanged. Each{' '}
          {terms.group} is listed below.
        </p>
      )}
      <p className="summary__note">
        Change in percentage points, previous period to current period. {capitalize(terms.groups)} are drawn on the same
        scale as the overall figure.
      </p>
    </div>
  )
}
