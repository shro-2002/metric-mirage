/** Wording that differs between the fictional example and an uploaded file. */
export interface Terms {
  metric: string // "pass rate"
  metricPlural: string // "pass rates"
  group: string // "site"
  groups: string // "sites"
  unit: string // "students" — what `total` counts
  shareOf: string // "students" / "the total count", as in "North's share of students"
  mixPhrase: string // "the mix of students across sites" / "the mix across groups"
  briefingTitle: string
  decisionLead: string // "If next year's site funding followed the headline"
  eyebrow: string
  dek: string // standfirst beside the headline; neutral, never reveals the group-level result
}

export const EXAMPLE_TERMS: Terms = {
  metric: 'pass rate',
  metricPlural: 'pass rates',
  group: 'site',
  groups: 'sites',
  unit: 'students',
  shareOf: 'students',
  mixPhrase: 'the mix of students across sites',
  briefingTitle: 'Tutoring network performance review',
  decisionLead: "If next year's site funding followed this headline",
  eyebrow: 'Tutoring network · Performance review',
  dek: "A fictional tutoring network's monthly report. Leadership plans to use this number to decide next year's funding for its four sites.",
}

export const UPLOAD_TERMS: Terms = {
  metric: 'success rate',
  metricPlural: 'success rates',
  group: 'group',
  groups: 'groups',
  unit: 'total count',
  shareOf: 'the total count',
  mixPhrase: 'the mix across groups',
  briefingTitle: 'Performance review',
  decisionLead: 'If decisions followed this headline alone',
  eyebrow: 'Your data · Previous vs. current',
  dek: 'Your two-period file, analyzed entirely in this browser. Nothing was uploaded anywhere.',
}

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)
