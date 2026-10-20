import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'

import { App } from './App'
import { tutoringExample } from './data/tutoring-example'
import { analyze } from './engine/analyze'

describe('App — headline and reveal', () => {
  test('first screen shows the headline but no site-level result', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pass rates are up 4 points.')
    expect(screen.getByText('62.5%')).toBeInTheDocument()
    expect(screen.getByText('66.5%')).toBeInTheDocument()
    expect(screen.getByText('Fictional example data')).toBeInTheDocument()
    expect(screen.queryByText(/Every site declined/)).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  test('revealing keeps the headline, expands beneath it and moves focus to the investigation', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: 'Look beneath the headline' })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAccessibleName('Hide the investigation')
    expect(screen.getByRole('heading', { level: 2, name: 'Beneath the headline' })).toHaveFocus()
    expect(screen.getByTestId('finding')).toHaveTextContent('Every site declined. So why did the overall pass rate rise?')

    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(rows.map((r) => within(r).getByRole('rowheader').querySelector('.sites__label')?.textContent)).toEqual([
      'North',
      'East',
      'South',
      'West',
    ])
    expect(rows[0]).toHaveTextContent('80.0%')
    expect(rows[0]).toHaveTextContent('78.0%')
    expect(rows[0]).toHaveTextContent('−2.0')
    expect(rows[0]).toHaveTextContent('Down')
  })

  test('the on-screen equation is exactly the engine equation', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Look beneath the headline' }))
    const equation = screen.getByTestId('equation').textContent!.replace(/\s+/g, ' ').trim()
    expect(equation).toBe(`${analyze(tutoringExample).display.equation} percentage points`)
  })

  test('keyboard: Enter on the button reveals, Enter again hides', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Look beneath the headline' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('table')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Hide the investigation' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  test('collapsing returns focus to the reveal control', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Look beneath the headline' }))
    await user.click(screen.getByRole('button', { name: 'Hide the investigation' }))
    expect(screen.getByRole('button', { name: 'Look beneath the headline' })).toHaveFocus()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
