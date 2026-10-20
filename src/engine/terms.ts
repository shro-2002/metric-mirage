/** Wording that differs between the fictional example and an uploaded file. */
export interface Terms {
  metric: string // "pass rate"
  metricPlural: string // "pass rates"
  group: string // "site"
  groups: string // "sites"
  unit: string // "students" — what `total` counts
  shareOf: string // "students" / "the total count", as in "North's share of students"
  moreOf: string // "more students" / "more of the total count"
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
  moreOf: 'more students',
  eyebrow: 'Tutoring network · Performance review',
  dek: "A fictional tutoring network's monthly report, as it might reach leadership. Four sites, two periods, one number.",
}

export const UPLOAD_TERMS: Terms = {
  metric: 'success rate',
  metricPlural: 'success rates',
  group: 'group',
  groups: 'groups',
  unit: 'total count',
  shareOf: 'the total count',
  moreOf: 'more of the total count',
  eyebrow: 'Your data · Previous vs. current',
  dek: 'Your two-period file, analyzed entirely in this browser. Nothing was uploaded anywhere.',
}

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)
