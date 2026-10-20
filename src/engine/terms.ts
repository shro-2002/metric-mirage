/** Wording that differs between the fictional example and an uploaded file. */
export interface Terms {
  metric: string // "pass rate"
  metricPlural: string // "pass rates"
  group: string // "site"
  groups: string // "sites"
  unit: string // "students" — what `total` counts
  shareOf: string // "students" / "the total count", as in "North's share of students"
  eyebrow: string
}

export const EXAMPLE_TERMS: Terms = {
  metric: 'pass rate',
  metricPlural: 'pass rates',
  group: 'site',
  groups: 'sites',
  unit: 'students',
  shareOf: 'students',
  eyebrow: 'Tutoring network · Performance review',
}

export const UPLOAD_TERMS: Terms = {
  metric: 'success rate',
  metricPlural: 'success rates',
  group: 'group',
  groups: 'groups',
  unit: 'total count',
  shareOf: 'the total count',
  eyebrow: 'Your data · Previous vs. current',
}

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)
