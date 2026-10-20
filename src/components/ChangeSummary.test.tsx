import { render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { tutoringExample } from '../data/tutoring-example'
import { analyze } from '../engine/analyze'
import { EXAMPLE_TERMS, UPLOAD_TERMS } from '../engine/terms'
import { ChangeSummary } from './ChangeSummary'

describe('ChangeSummary', () => {
  test('flagship: overall +4.0 above four −2.0 rows', () => {
    render(<ChangeSummary analysis={analyze(tutoringExample)} terms={EXAMPLE_TERMS} />)
    const rows = within(screen.getByTestId('change-summary')).getAllByRole('listitem')
    expect(rows.map((r) => r.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Overall pass rate▲+4.0 points, up pp',
      'North▼−2.0 points, down pp',
      'East▼−2.0 points, down pp',
      'South▼−2.0 points, down pp',
      'West▼−2.0 points, down pp',
    ])
  })

  test('more than 10 groups: overall row plus an honest tally instead of a long list', () => {
    const groups = Array.from({ length: 12 }, (_, i) => ({
      name: `G${i}`,
      previous: { successes: 50, total: 100 },
      current: { successes: i < 7 ? 55 : 45, total: 100 },
    }))
    render(<ChangeSummary analysis={analyze({ groups })} terms={UPLOAD_TERMS} />)
    expect(within(screen.getByTestId('change-summary')).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText(/Across 12 groups: 7 rose, 5 fell, 0 unchanged/)).toBeInTheDocument()
  })
})
