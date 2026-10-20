// Deterministic wording generated from the Analysis. No AI, no randomness:
// the same input always produces the same text, and every number comes from
// `analysis.display` so the prose can never disagree with the figures.
// Nothing here says *why* a rate changed; it describes what changed.

import { add, sign, sub, type Rational } from './rational'
import { capitalize, type Terms } from './terms'
import type { Analysis, Direction, GroupResult } from './types'

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
const count = (n: number): string => NUMBER_WORDS[n] ?? String(n)
const plural = (n: number, terms: Terms): string => (n === 1 ? terms.group : terms.groups)
const points = (magnitude: string): string => (magnitude === '1' ? 'point' : 'points')

const moved = (d: Direction): string => (d === 'up' ? 'rose' : d === 'down' ? 'fell' : 'held steady')
const groupMoved = (d: Direction): string => (d === 'up' ? 'improved' : 'declined')

/** "Every site", "Both sites", or "The site", for statements about all groups. */
const allGroups = (n: number, terms: Terms): string => {
  if (n === 1) return `The ${terms.group}`
  if (n === 2) return `Both ${terms.groups}`
  return `Every ${terms.group}`
}

const tally = (analysis: Analysis) => {
  const up = analysis.groups.filter((g) => g.direction === 'up').length
  const down = analysis.groups.filter((g) => g.direction === 'down').length
  return { up, down, unchanged: analysis.groups.length - up - down, total: analysis.groups.length }
}

/** "Pass rates are up 4 points." */
export const headline = (analysis: Analysis, terms: Terms): string => {
  const subject = capitalize(terms.metricPlural)
  const { netMagnitude } = analysis.display
  switch (analysis.overall.direction) {
    case 'up':
      return `${subject} are up ${netMagnitude} ${points(netMagnitude)}.`
    case 'down':
      return `${subject} are down ${netMagnitude} ${points(netMagnitude)}.`
    case 'unchanged':
      return `${subject} are unchanged.`
  }
}

/** The central finding shown after the reveal. Reversal framing only for a true reversal. */
export const finding = (analysis: Analysis, terms: Terms): string => {
  const t = tally(analysis)
  const overall = analysis.overall.direction
  const m = terms.metric

  switch (analysis.pattern) {
    case 'reversal': {
      const groupsDirection = overall === 'up' ? 'down' : 'up'
      return `${allGroups(t.total, terms)} ${groupMoved(groupsDirection)}. So why did the overall ${m} ${overall === 'up' ? 'rise' : 'fall'}?`
    }
    case 'consistent': {
      if (t.unchanged === 0) {
        return `${allGroups(t.total, terms)} ${groupMoved(overall)}, and so did the overall ${m}. The headline and the ${terms.groups} point the same way.`
      }
      const changed = t.up + t.down
      return `${capitalize(count(changed))} ${plural(changed, terms)} ${groupMoved(overall)} and ${count(t.unchanged)} held steady; the overall ${m} ${moved(overall)} with them. The headline and the ${terms.groups} point the same way.`
    }
    case 'mixed': {
      const steady = t.unchanged > 0 ? `, and ${count(t.unchanged)} held steady` : ''
      return `${capitalize(count(t.up))} ${plural(t.up, terms)} improved and ${count(t.down)} declined${steady}. The overall ${m} ${moved(overall)}: a mixed picture, not a complete reversal.`
    }
    case 'divergent': {
      const changed = t.up + t.down
      const direction: Direction = t.up > 0 ? 'up' : 'down'
      if (overall === 'unchanged' && t.unchanged === 0) {
        return `${allGroups(t.total, terms)} ${groupMoved(direction)}, yet the overall ${m} held steady.`
      }
      const lead = `${capitalize(count(changed))} ${plural(changed, terms)} ${groupMoved(direction)} and ${count(t.unchanged)} held steady, yet the overall ${m} ${overall === 'unchanged' ? 'did not change' : moved(overall)}.`
      return overall === 'unchanged' ? lead : `${lead} Not every ${terms.group} moved, so this is not a complete reversal.`
    }
    case 'groupsUnchanged':
      return overall === 'unchanged'
        ? `Nothing moved: every ${terms.group}'s ${m} and the overall ${m} held steady.`
        : `No ${terms.group}'s ${m} changed, yet the overall ${m} ${moved(overall)}.`
  }
}

const shareChange = (g: GroupResult): Rational => sub(g.current.share, g.previous.share)
const averageRate = (g: GroupResult): Rational => add(g.previous.rate, g.current.rate) // ×2, fine for comparison

const pickExtreme = (groups: GroupResult[], wanted: 1 | -1): GroupResult | undefined =>
  groups
    .filter((g) => sign(shareChange(g)) === wanted)
    .reduce<GroupResult | undefined>((best, g) => {
      if (!best) return g
      const diff = sub(shareChange(g), shareChange(best))
      return sign(diff) === wanted ? g : best
    }, undefined)

const unsigned = (text: string): string => text.replace(/^[+\u2212]/, '')

/** How the within-group changes moved the overall rate, in words (no equation). */
const withinSentence = (analysis: Analysis, terms: Terms): string => {
  const { display, decomposition, groups } = analysis
  const m = terms.metric
  const rateSign = sign(decomposition.rateEffect)
  const t = tally(analysis)
  if (t.unchanged === t.total) return `No ${terms.group}'s own ${m} changed.`
  if (rateSign === 0) return `Within the ${terms.groups}, the rises and falls offset each other exactly.`
  const allSame = t.unchanged === 0 && (t.up === t.total || t.down === t.total)
  const lead = allSame
    ? `${allGroups(groups.length, terms)}'s own ${m} ${moved(groups[0]!.direction)}`
    : `Weighted by size, the changes within the ${terms.groups}`
  return `${lead}, which on its own ${rateSign < 0 ? 'pulled the overall rate down' : 'pushed the overall rate up'} by ${unsigned(display.rateEffect)} points.`
}

/**
 * Plain-English meaning of the rate/mix split, built only from calculated findings.
 * The equation itself is shown separately; this says what it means.
 */
export const explanation = (analysis: Analysis, terms: Terms): string => {
  const { display, decomposition, groups } = analysis
  const m = terms.metric
  const sentences: string[] = [withinSentence(analysis, terms)]

  const gainer = pickExtreme(groups, 1)
  const loser = pickExtreme(groups, -1)
  const rateSign = sign(decomposition.rateEffect)
  const compositionSign = sign(decomposition.compositionEffect)
  const mixAmount = unsigned(display.compositionEffect)

  if (!gainer || !loser) {
    sentences.push(`The mix of ${terms.groups} did not change, so the whole change comes from within the ${terms.groups}.`)
  } else {
    sentences.push(
      `Meanwhile, ${gainer.name}'s share of ${terms.shareOf} grew from ${gainer.display.previousShare} to ${gainer.display.currentShare}, while ${loser.name}'s fell from ${loser.display.previousShare} to ${loser.display.currentShare}.`,
    )
    const gainerHigher = sign(sub(averageRate(gainer), averageRate(loser)))
    // With opposite signs, sign(rate + composition) tells which part is larger, exactly.
    const netSign = sign(add(decomposition.rateEffect, decomposition.compositionEffect))
    const offsets =
      rateSign === 0 || compositionSign === 0 || rateSign === compositionSign
        ? ''
        : netSign === compositionSign
          ? `, more than offsetting the change within the ${terms.groups}`
          : netSign === 0
            ? `, exactly offsetting the change within the ${terms.groups}`
            : `, offsetting part of the change within the ${terms.groups}`
    const verb = compositionSign > 0 ? 'added' : 'took away'
    if (compositionSign === 0) {
      sentences.push(`Taken together, these shifts in mix left the overall ${m} unchanged.`)
    } else if ((gainerHigher > 0 && compositionSign > 0) || (gainerHigher < 0 && compositionSign < 0)) {
      const level = gainerHigher > 0 ? 'higher' : 'lower'
      sentences.push(
        `${gainer.name} has the ${level} ${m} of the two, so with ${terms.moreOf} there, the shift in mix ${verb} ${mixAmount} points${offsets}.`,
      )
    } else {
      sentences.push(`Taken together, the shifts in mix ${verb} ${mixAmount} points${offsets}.`)
    }
  }

  if (display.approximate) sentences.push('Figures are rounded and may not sum exactly.')
  return sentences.join(' ')
}
