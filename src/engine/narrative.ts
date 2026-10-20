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

/** "Every site's", "Both groups'", "The site's". */
const allGroupsPossessive = (n: number, terms: Terms): string => (n === 2 ? `Both ${terms.groups}'` : `${allGroups(n, terms)}'s`)

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
      return `${allGroups(t.total, terms)} ${groupMoved(groupsDirection)}—even though the overall ${m} ${overall === 'up' ? 'rose' : 'fell'}.`
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

/** Shares visibly moved (their displayed values differ). */
const shareVisiblyMoved = (g: GroupResult): boolean => g.display.previousShare !== g.display.currentShare

/**
 * The single gainer/loser pair, only when exactly two groups' shares changed.
 * Shares sum to 1, so the pair's changes are equal and opposite and the whole
 * composition effect is exactly (avg rate of gainer − avg rate of loser) × share moved.
 * With more groups moving, naming one pair could misattribute the effect.
 */
const exactPair = (groups: GroupResult[]): { gainer: GroupResult; loser: GroupResult } | undefined => {
  const movers = groups.filter((g) => sign(shareChange(g)) !== 0)
  if (movers.length !== 2) return undefined
  const gainer = movers.find((g) => sign(shareChange(g)) > 0)
  const loser = movers.find((g) => sign(shareChange(g)) < 0)
  return gainer && loser && shareVisiblyMoved(gainer) ? { gainer, loser } : undefined
}

/** "had the higher pass rate in both periods" / "on average across the two periods". */
const levelComparison = (gainer: GroupResult, loser: GroupResult, terms: Terms): string | undefined => {
  const avg = sign(sub(averageRate(gainer), averageRate(loser)))
  if (avg === 0) return undefined
  const level = avg > 0 ? 'higher' : 'lower'
  const bothPeriods =
    sign(sub(gainer.previous.rate, loser.previous.rate)) === avg && sign(sub(gainer.current.rate, loser.current.rate)) === avg
  return `had the ${level} ${terms.metric} ${bothPeriods ? 'in both periods' : 'on average across the two periods'}`
}

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
  const effect = `${rateSign < 0 ? 'pulled the overall rate down' : 'pushed the overall rate up'} by ${unsigned(display.rateEffect)} points`
  return allSame
    ? `${allGroupsPossessive(groups.length, terms)} own ${m} ${moved(groups[0]!.direction)}, which on its own ${effect}.`
    : `Weighted by size, the changes within the ${terms.groups} on their own ${effect}.`
}

/**
 * Plain-English meaning of the rate/mix split, built only from calculated findings.
 * The equation itself is shown separately; this says what it means.
 */
export const explanation = (analysis: Analysis, terms: Terms): string => {
  const { display, decomposition, groups } = analysis
  const m = terms.metric
  const sentences: string[] = [withinSentence(analysis, terms)]

  const rateSign = sign(decomposition.rateEffect)
  const compositionSign = sign(decomposition.compositionEffect)
  const mixAmount = unsigned(display.compositionEffect)
  const verb = compositionSign > 0 ? 'added' : 'took away'
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

  const visibleMovers = groups.filter(shareVisiblyMoved)
  const pair = exactPair(groups)

  if (groups.every((g) => sign(shareChange(g)) === 0)) {
    sentences.push(`The mix of ${terms.groups} did not change, so the whole change comes from within the ${terms.groups}.`)
  } else if (visibleMovers.length === 0) {
    sentences.push(`The mix of ${terms.groups} shifted only very slightly, and taken together the shift ${verb} ${mixAmount} points${offsets}.`)
  } else if (pair) {
    const { gainer, loser } = pair
    sentences.push(
      `Meanwhile, ${gainer.name}'s share of ${terms.shareOf} grew from ${gainer.display.previousShare} to ${gainer.display.currentShare}, while ${loser.name}'s fell from ${loser.display.previousShare} to ${loser.display.currentShare}.`,
    )
    const level = levelComparison(gainer, loser, terms)
    sentences.push(
      level && compositionSign !== 0
        ? `${gainer.name} ${level}, so with ${terms.moreOf} there, the shift in mix ${verb} ${mixAmount} points${offsets}.`
        : `Taken together, the shift in mix ${compositionSign === 0 ? 'left the overall rate unchanged' : `${verb} ${mixAmount} points${offsets}`}.`,
    )
  } else {
    const gainer = pickExtreme(groups, 1)!
    const loser = pickExtreme(groups, -1)!
    sentences.push(
      `Shares shifted among several ${terms.groups}: the largest gain was ${gainer.name} (${gainer.display.previousShare} → ${gainer.display.currentShare}) and the largest drop ${loser.name} (${loser.display.previousShare} → ${loser.display.currentShare}).`,
    )
    sentences.push(
      compositionSign === 0
        ? `Taken together, these shifts left the overall ${m} unchanged.`
        : `Taken together, these shifts in mix ${verb} ${mixAmount} points${offsets}.`,
    )
  }

  if (display.approximate) sentences.push('Figures are rounded and may not sum exactly.')
  return sentences.join(' ')
}

/** Deterministic, copyable management briefing. Every figure comes from `analysis.display`. */
export const briefing = (analysis: Analysis, terms: Terms): string => briefingSentences(analysis, terms).join(' ')

const listGroups = (groups: GroupResult[]): string => {
  // When rounding makes both rates look identical, include the signed change so "rose" is visible.
  const items = groups.map((g) =>
    g.display.previousRate === g.display.currentRate && g.direction !== 'unchanged'
      ? `${g.name} (${g.display.previousRate} → ${g.display.currentRate}, ${g.display.change} points)`
      : `${g.name} (${g.display.previousRate} → ${g.display.currentRate})`,
  )
  return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

const groupResultsSentence = (analysis: Analysis, terms: Terms): string => {
  const t = tally(analysis)
  const { groups } = analysis
  if (t.unchanged === 0 && (t.up === t.total || t.down === t.total)) {
    const verb = t.up === t.total ? 'improved' : 'declined'
    return `${allGroupsPossessive(t.total, terms)} ${terms.metric} ${verb}: ${listGroups(groups)}.`
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
      const rising = overall.direction === 'up'
      const change = rising ? 'increase' : 'decline'
      const within = rising ? 'improvement' : 'deterioration'
      const pair = exactPair(groups)
      const towardHigher = pair ? sign(sub(averageRate(pair.gainer), averageRate(pair.loser))) : 0
      if (pair && ((rising && towardHigher > 0) || (!rising && towardHigher < 0))) {
        const { gainer, loser } = pair
        return `The overall ${change} reflects a shift in the mix toward ${rising ? 'higher' : 'lower'}-performing ${terms.groups} (${gainer.name}'s share of ${terms.shareOf} grew from ${gainer.display.previousShare} to ${gainer.display.currentShare}; ${loser.name}'s fell from ${loser.display.previousShare} to ${loser.display.currentShare}), not ${within} within ${terms.groups}.`
      }
      return `The overall ${change} reflects the shift in ${terms.mixPhrase}, not ${within} within ${terms.groups}.`
    }
    case 'consistent':
      return `The overall change and the ${terms.groups} point in the same direction.`
    case 'mixed':
      return `Results were mixed across ${terms.groups}, so the overall figure should be read alongside the ${terms.group}-level results.`
    case 'divergent': {
      const t = tally(analysis)
      if (overall.direction === 'unchanged' && t.unchanged === 0) {
        return `Every ${terms.group} moved the same way, yet the overall ${terms.metric} did not change: the shift in ${terms.mixPhrase} exactly offset the change within ${terms.groups}.`
      }
      if (overall.direction === 'unchanged') {
        return `The overall ${terms.metric} did not change even though some ${terms.groups} did; the shift in ${terms.mixPhrase} offset the change within them.`
      }
      return `The overall ${terms.metric} moved against every ${terms.group} that changed, but not every ${terms.group} changed, so this is not a complete reversal.`
    }
    case 'groupsUnchanged':
      return sign(decomposition.compositionEffect) === 0
        ? `Neither the ${terms.groups} nor their mix changed.`
        : `The overall change comes entirely from the shift in ${terms.mixPhrase}.`
  }
}

/** The briefing as separate sentences: shown as a scannable list, copied as one paragraph. */
export const briefingSentences = (analysis: Analysis, terms: Terms): string[] => {
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
  return sentences
}
