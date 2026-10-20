import type { CSSProperties } from 'react'

import { capitalize, type Terms } from '../engine/terms'
import { sign, sub, toNumber } from '../engine/rational'
import type { Direction, GroupResult } from '../engine/types'
import { Arrow } from './Arrow'
import './SiteComparison.css'

type Props = {
  groups: GroupResult[]
  terms: Terms
}

const DIRECTION_LABEL: Record<Direction, string> = { up: 'Up', down: 'Down', unchanged: 'Unchanged' }
const DIRECTION_GLYPH: Record<Direction, string> = { up: '▲', down: '▼', unchanged: '●' }

/** Dot plot on a 0–100% track: hollow = previous, filled = current. Decorative; text carries the data. */
function RateTrack({ group }: { group: GroupResult }) {
  const from = toNumber(group.previous.rate) * 100
  const to = toNumber(group.current.rate) * 100
  const style = {
    '--from': `${from}%`,
    '--to': `${to}%`,
    '--left': `${Math.min(from, to)}%`,
    '--width': `${Math.abs(to - from)}%`,
  } as CSSProperties
  return (
    <span className={`rate-track rate-track--${group.direction}`} style={style} aria-hidden="true">
      <span className="rate-track__move" />
      <span className="rate-track__from" />
      <span className="rate-track__to" />
    </span>
  )
}

/** Share of the total; highlighted in the composition color when it moved. */
function ShareChange({ group, terms }: { group: GroupResult; terms: Terms }) {
  const shift = sign(sub(group.current.share, group.previous.share))
  const marker = shift > 0 ? '▲' : shift < 0 ? '▼' : ''
  return (
    <span className={`sites__share num${shift !== 0 ? ' sites__share--moved' : ''}`}>
      Share<span className="sites__share-long"> of {terms.shareOf}</span>:{' '}
      <span className="sites__share-values">
        {group.display.previousShare} <Arrow /> {group.display.currentShare}
        {marker && (
          <span aria-hidden="true" className="sites__share-marker">
            {' '}
            {marker}
          </span>
        )}
      </span>
    </span>
  )
}

export function SiteComparison({ groups, terms }: Props) {
  return (
    <table className="sites">
      <caption className="visually-hidden">
        {capitalize(terms.metric)} by {terms.group}, previous period to current period, with each {terms.group}'s share
        of {terms.shareOf}
      </caption>
      <thead>
        <tr>
          <th scope="col">{capitalize(terms.group)}</th>
          <th scope="col">
            {capitalize(terms.metric)}{' '}
            <span className="sites__hint">
              previous <Arrow /> current
            </span>
          </th>
          <th scope="col" className="sites__change-head">
            Change <span className="sites__hint">points</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.map((g) => (
          <tr key={g.name} className={`sites__row sites__row--${g.direction}`}>
            <th scope="row" className="sites__name">
              <span className="sites__label">{g.name}</span>
            </th>
            <td className="sites__rates">
              <span className="num">
                {g.display.previousRate} <Arrow /> <strong>{g.display.currentRate}</strong>
              </span>
              <RateTrack group={g} />
              <ShareChange group={g} terms={terms} />
            </td>
            <td className="sites__change">
              <span className={`change change--${g.direction}`}>
                <span className="num change__value">
                  <span aria-hidden="true" className="change__glyph">
                    {DIRECTION_GLYPH[g.direction]}
                  </span>
                  {g.display.change}
                </span>
                <span className="change__word">{DIRECTION_LABEL[g.direction]}</span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
