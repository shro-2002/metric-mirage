import type { Dataset } from '../engine/types'

/** Fictional tutoring network (flagship example). Not real data. */
export const tutoringExample: Dataset = {
  groups: [
    { name: 'North', previous: { successes: 200, total: 250 }, current: { successes: 312, total: 400 } },
    { name: 'East', previous: { successes: 175, total: 250 }, current: { successes: 170, total: 250 } },
    { name: 'South', previous: { successes: 150, total: 250 }, current: { successes: 145, total: 250 } },
    { name: 'West', previous: { successes: 100, total: 250 }, current: { successes: 38, total: 100 } },
  ],
}
