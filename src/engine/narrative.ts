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

const listGroups = (groups: GroupResult[]): string => {
  const items = groups.map((g) => `${g.name} (${g.display.previousRate} → ${g.display.currentRate})`)
  return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

const groupResultsSentence = (analysis: Analysis, terms: Terms): string => {
  const t = tally(analysis)
  const { groups } = analysis
  if (t.unchanged === 0 && (t.up === t.total || t.down === t.total)) {
    const verb = t.up === t.total ? 'improved' : 'declined'
    return `${allGroups(t.total, terms)}'s ${terms.metric} ${verb}: ${listGroups(groups)}.`
  }
  const parts = (
    [
      ['rose at', 'up'],
      ['fell at', 'down'],
      ['was unchanged at', 'unchanged'],
    ] as const
  )
    .map(([verb, direction]) => [verb, groups.filter((g) => g.direction === direction)] as const)
    .filter(([, members]) => members.length > 0)
    .map(([verb, members]) => `${verb} ${listGroups(members)}`)
  return `${capitalize(terms.metric)} ${parts.join('; ')}.`
}

const interpretationSentence = (analysis: Analysis, terms: Terms): string => {
  const { pattern, overall, groups, decomposition } = analysis
  switch (pattern) {
    case 'reversal': {
      const gainer = pickExtreme(groups, 1)
      const loser = pickExtreme(groups, -1)
      const rising = overall.direction === 'up'
      const change = rising ? 'increase' : 'decline'
      const within = rising ? 'improvement' : 'deterioration'
      const towardHigher = gainer && loser ? sign(sub(averageRate(gainer), averageRate(loser))) : 0
      const sameWay = (rising && towardHigher > 0) || (!rising && towardHigher < 0)
      if (gainer && loser && sameWay) {
        return `The overall ${change} reflects a shift in the mix toward ${rising ? 'higher' : 'lower'}-performing ${terms.groups} (${gainer.name}'s share of ${terms.shareOf} grew from ${gainer.display.previousShare} to ${gainer.display.currentShare}; ${loser.name}'s fell from ${loser.display.previousShare} to ${loser.display.currentShare}), not ${within} within ${terms.groups}.`
      }
      return `The overall ${change} reflects the shift in ${terms.mixPhrase}, not ${within} within ${terms.groups}.`
    }
    case 'consistent':
      return `The overall change and the ${terms.groups} point in the same direction.`
    case 'mixed':
      return `Results were mixed across ${terms.groups}, so the overall figure should be read alongside the ${terms.group}-level results.`
    case 'divergent':
      return `The overall ${terms.metric} moved differently from the ${terms.groups} that changed; not every ${terms.group} changed, so this is not a complete reversal.`
    case 'groupsUnchanged':
      return sign(decomposition.compositionEffect) === 0
        ? `Neither the ${terms.groups} nor their mix changed.`
        : `The overall change comes entirely from the shift in ${terms.mixPhrase}.`
  }
}

/** Deterministic, copyable management briefing. Every figure comes from `analysis.display`. */
export const briefing = (analysis: Analysis, terms: Terms): string => {
  const { display, overall } = analysis
  const m = terms.metric
  const opening =
    overall.direction === 'unchanged'
      ? `${terms.briefingTitle}: the overall ${m} was unchanged at ${display.currentRate} (${display.net} percentage points).`
      : `${terms.briefingTitle}: the overall ${m} ${overall.direction === 'up' ? 'rose' : 'fell'} from ${display.previousRate} to ${display.currentRate} (${display.net} percentage points).`
  const sentences = [
    opening,
    `Within-${terms.group} ${terms.metricPlural} changed by ${display.rateEffect} points and ${terms.mixPhrase} by ${display.compositionEffect} points, which together account for the overall change (${display.equation}).`,
    groupResultsSentence(analysis, terms),
    interpretationSentence(analysis, terms),
    'This is a descriptive analysis of two periods; it does not establish causes or statistical significance.',
  ]
  if (display.approximate) sentences.push('Figures are rounded and may not sum exactly.')
  return sentences.join(' ')
}
