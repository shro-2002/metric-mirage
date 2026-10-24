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
    sentences.push(`Each ${terms.group}'s share of ${terms.shareOf} stayed the same, so the whole change comes from within the ${terms.groups}.`)
  } else if (visibleMovers.length === 0) {
    sentences.push(`Shares changed only very slightly, and taken together the changing distribution ${verb} ${mixAmount} points${offsets}.`)
  } else if (pair) {
    const { gainer, loser } = pair
    sentences.push(
      `Meanwhile, ${gainer.name}'s share of ${terms.shareOf} grew from ${gainer.display.previousShare} to ${gainer.display.currentShare}, while ${loser.name}'s fell from ${loser.display.previousShare} to ${loser.display.currentShare}.`,
    )
    const level = levelComparison(gainer, loser, terms)
    sentences.push(
      level && compositionSign !== 0
        ? `${gainer.name} ${level}, so with a larger share of ${terms.shareOf} there, the changing distribution ${verb} ${mixAmount} points${offsets}.`
        : `Taken together, the changing distribution ${compositionSign === 0 ? 'left the overall rate unchanged' : `${verb} ${mixAmount} points${offsets}`}.`,
    )
  } else {
    const gainer = pickExtreme(groups, 1)!
    const loser = pickExtreme(groups, -1)!
    sentences.push(
      `Shares changed across several ${terms.groups}: the largest gain was ${gainer.name} (${gainer.display.previousShare} → ${gainer.display.currentShare}) and the largest drop ${loser.name} (${loser.display.previousShare} → ${loser.display.currentShare}).`,
    )
    sentences.push(
      compositionSign === 0
        ? `Taken together, the changing distribution left the overall ${m} unchanged.`
        : `Taken together, the changing distribution ${verb} ${mixAmount} points${offsets}.`,
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
        return `The overall ${change} reflects a changing distribution toward ${rising ? 'higher' : 'lower'}-performing ${terms.groups} (${gainer.name}'s share of ${terms.shareOf} grew from ${gainer.display.previousShare} to ${gainer.display.currentShare}; ${loser.name}'s fell from ${loser.display.previousShare} to ${loser.display.currentShare}), not ${within} within ${terms.groups}.`
      }
      return `The overall ${change} reflects the changing ${terms.mixPhrase}, not ${within} within ${terms.groups}.`
    }
    case 'consistent':
      return `The overall change and the ${terms.groups} point in the same direction.`
    case 'mixed':
      return `Results were mixed across ${terms.groups}, so the overall figure should be read alongside the ${terms.group}-level results.`
    case 'divergent': {
      const t = tally(analysis)
      if (overall.direction === 'unchanged' && t.unchanged === 0) {
        return `Every ${terms.group} moved the same way, yet the overall ${terms.metric} did not change: the changing ${terms.mixPhrase} exactly offset the change within ${terms.groups}.`
      }
      if (overall.direction === 'unchanged') {
        return `The overall ${terms.metric} did not change even though some ${terms.groups} did; the changing ${terms.mixPhrase} offset the change within them.`
      }
      return `The overall ${terms.metric} moved against every ${terms.group} that changed, but not every ${terms.group} changed, so this is not a complete reversal.`
    }
    case 'groupsUnchanged':
      return sign(decomposition.compositionEffect) === 0
        ? `Neither the ${terms.groups}' rates nor their shares changed.`
        : `The overall change comes entirely from the changing ${terms.mixPhrase}.`
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
    `The change within ${terms.groups} contributed ${display.rateEffect} points and the changing ${terms.mixPhrase} contributed ${display.compositionEffect} points, which together account for the overall change (${display.equation}).`,
    groupResultsSentence(analysis, terms),
    interpretationSentence(analysis, terms),
    'This is a descriptive analysis of two periods; it does not establish causes or statistical significance.',
  ]
  if (display.approximate) sentences.push('Figures are rounded and may not sum exactly.')
  return sentences
}

export type ForceKey = 'rate' | 'composition' | 'net'
export interface Force {
  key: ForceKey
  label: string
  value: string // the on-screen effect in percentage points, e.g. "+6.0"
  text: string
}

/** "Three groups improved, one declined and one held steady." */
const directionCounts = (analysis: Analysis, terms: Terms): string => {
  const t = tally(analysis)
  const parts = (
    [
      [t.up, 'improved'],
      [t.down, 'declined'],
      [t.unchanged, 'held steady'],
    ] as const
  ).filter(([n]) => n > 0)
  const words = parts.map(([n, verb], i) => (i === 0 ? `${capitalize(count(n))} ${plural(n, terms)} ${verb}` : `${count(n)} ${verb}`))
  return words.length === 1 ? words[0]! : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`
}

const rateForceText = (analysis: Analysis, terms: Terms): string => {
  const { groups, decomposition } = analysis
  const t = tally(analysis)
  if (t.unchanged === t.total) return `No ${terms.group}'s ${terms.metric} changed.`
  if (t.unchanged === 0 && (t.up === t.total || t.down === t.total)) {
    const verb = t.up === t.total ? 'rose' : 'fell'
    const first = groups[0]!.display.change
    const sameChange = groups.every((g) => g.display.change === first)
    return `${allGroupsPossessive(t.total, terms)} ${t.total === 2 ? terms.metricPlural : terms.metric} ${verb}${sameChange ? ` by ${unsigned(first)} ${points(unsigned(first))}` : ''}.`
  }
  const rateSign = sign(decomposition.rateEffect)
  const net =
    rateSign === 0
      ? 'these changes cancelled out'
      : `they ${rateSign > 0 ? 'pushed the overall rate up' : 'pulled the overall rate down'}`
  return `${directionCounts(analysis, terms)}. Weighted by size, ${net}.`
}

/** "the highest-performing site" when the group is strictly highest (or lowest) on average. */
const standing = (group: GroupResult, groups: GroupResult[], terms: Terms): string | undefined => {
  const others = groups.filter((g) => g !== group)
  const sides = others.map((g) => sign(sub(averageRate(group), averageRate(g))))
  const degree = groups.length === 2 ? ['higher', 'lower'] : ['highest', 'lowest']
  if (sides.every((x) => x > 0)) return `the ${degree[0]}-performing ${terms.group}`
  if (sides.every((x) => x < 0)) return `the ${degree[1]}-performing ${terms.group}`
  return undefined
}

const compositionForceText = (analysis: Analysis, terms: Terms): string => {
  const { groups, decomposition } = analysis
  if (groups.every((g) => sign(shareChange(g)) === 0)) return `Each ${terms.group}'s share of ${terms.shareOf} stayed the same.`
  if (!groups.some(shareVisiblyMoved)) return `Each ${terms.group}'s share of ${terms.shareOf} changed only very slightly.`
  const pair = exactPair(groups)
  if (!pair) {
    const gainer = pickExtreme(groups, 1)!
    const loser = pickExtreme(groups, -1)!
    return `Shares changed across several ${terms.groups}. The largest changes: ${gainer.name}'s share of ${terms.shareOf} rose from ${gainer.display.previousShare} to ${gainer.display.currentShare}, and ${loser.name}'s fell from ${loser.display.previousShare} to ${loser.display.currentShare}.`
  }
  const { gainer, loser } = pair
  const rank = standing(gainer, groups, terms)
  const named = rank ? `${gainer.name}, ${rank},` : gainer.name
  const shares = `${named} accounted for ${gainer.display.currentShare} of ${terms.shareOf} instead of ${gainer.display.previousShare}, while ${loser.name}'s share fell from ${loser.display.previousShare} to ${loser.display.currentShare}.`
  const compositionSign = sign(decomposition.compositionEffect)
  if (compositionSign === 0) return shares
  const level = sign(sub(averageRate(gainer), averageRate(loser))) > 0 ? 'higher' : 'lower'
  return `${shares} A larger share for a ${level}-performing ${terms.group} ${compositionSign > 0 ? 'raises' : 'lowers'} the overall ${terms.metric}.`
}

const netForceText = (analysis: Analysis, terms: Terms): string => {
  const { decomposition, pattern, overall, groups, display } = analysis
  const r = sign(decomposition.rateEffect)
  const c = sign(decomposition.compositionEffect)
  const n = sign(add(decomposition.rateEffect, decomposition.compositionEffect))
  const within = `the ${r < 0 ? 'decline' : 'improvement'} within ${terms.groups}`
  let text: string
  if (r === 0 && c === 0) text = `The overall ${terms.metric} did not change.`
  else if (r === 0) text = 'All of the overall change came from the changing distribution.'
  else if (c === 0) text = `All of the overall change came from within the ${terms.groups}.`
  else if (r === c) text = `Both effects pushed the overall ${terms.metric} ${r > 0 ? 'up' : 'down'}.`
  else if (n === 0) text = `The two effects cancelled out exactly, so the overall ${terms.metric} did not change.`
  else if (n === c) {
    const reversal =
      pattern === 'reversal'
        ? `, so the overall ${terms.metric} ${overall.direction === 'up' ? 'rose' : 'fell'} even though ${allGroups(groups.length, terms).toLowerCase()} ${groupMoved(groups[0]!.direction)}`
        : ''
    text = `The changing distribution outweighed ${within}${reversal}.`
  } else text = `${capitalize(within)} outweighed the changing distribution.`
  return display.approximate ? `${text} Figures are rounded and may not sum exactly.` : text
}

/**
 * The "why" as three short steps: the change within groups, the changing distribution, and the
 * overall result. Effect sizes sit in `value`; the text never puts an effect beside a share, so a
 * share change (25.0% to 40.0%) can't be read as the composition effect (+6.0 points).
 */
export const forces = (analysis: Analysis, terms: Terms): Force[] => {
  const { display } = analysis
  return [
    { key: 'rate', label: terms.withinLabel, value: display.rateEffect, text: rateForceText(analysis, terms) },
    { key: 'composition', label: terms.distributionLabel, value: display.compositionEffect, text: compositionForceText(analysis, terms) },
    { key: 'net', label: 'Overall result', value: display.net, text: netForceText(analysis, terms) },
  ]
}

/** What reading only the headline would mean for a decision. Honest for every pattern. */
export const decisionNote = (analysis: Analysis, terms: Terms): string => {
  const rising = analysis.overall.direction === 'up'
  switch (analysis.pattern) {
    case 'reversal':
      return rising
        ? `${terms.decisionLead}, it would reward an improvement that no ${terms.group} achieved: every ${terms.group}'s own ${terms.metric} fell. The rise came from the changing distribution of ${terms.shareOf} across ${terms.groups}, not from how the ${terms.groups} performed.`
        : `${terms.decisionLead}, it would blame a decline that no ${terms.group} had: every ${terms.group}'s own ${terms.metric} rose. The fall came from the changing distribution of ${terms.shareOf} across ${terms.groups}, not from how the ${terms.groups} performed.`
    case 'consistent':
      return `Here the headline and the ${terms.groups} agree, so the overall figure is a fair summary of the direction. Sizes still differ by ${terms.group}; see the evidence below.`
    case 'mixed':
      return `The headline averages ${terms.groups} that moved in opposite directions. Decisions about any single ${terms.group} need the ${terms.group}-level results, not the overall figure.`
    case 'divergent':
    case 'groupsUnchanged':
      return `The overall figure moved differently from the ${terms.groups}. Check the ${terms.group}-level results before acting on it.`
  }
}
