import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

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

describe('App — briefing', () => {
  const reveal = async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Look beneath the headline' }))
    return user
  }

  test('copies exactly the briefing shown on screen and confirms', async () => {
    const user = await reveal()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await user.click(screen.getByRole('button', { name: 'Copy briefing' }))
    expect(writeText).toHaveBeenCalledWith(screen.getByTestId('briefing').textContent)
    expect(screen.getByRole('status')).toHaveTextContent('Copied')
  })

  test('falls back to selecting the text when copying is blocked', async () => {
    const user = await reveal()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    })
    await user.click(screen.getByRole('button', { name: 'Copy briefing' }))
    expect(screen.getByRole('status')).toHaveTextContent('text is selected')
    expect(window.getSelection()?.toString()).toBe(screen.getByTestId('briefing').textContent)
  })
})

describe('App — CSV upload', () => {
  const SAMPLE = [
    'period,group,successes,total',
    'previous,Harbor,410,600',
    'previous,Mill,300,500',
    'current,Harbor,452,620',
    'current,Mill,331,505',
  ].join('\n')

  const upload = async (user: ReturnType<typeof userEvent.setup>, name: string, content: string) => {
    await user.upload(screen.getByLabelText('Choose a CSV file'), new File([content], name, { type: 'text/csv' }))
  }

  test('a valid upload replaces the example with generic wording and focuses the new headline', async () => {
    const user = userEvent.setup()
    render(<App />)
    await upload(user, 'my-data.csv', SAMPLE)

    const h1 = await screen.findByRole('heading', { level: 1, name: /^Success rates are up/ })
    expect(h1).toHaveFocus()
    expect(screen.getByText('Your file: my-data.csv')).toBeInTheDocument()
    expect(screen.queryByText('Fictional example data')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Look beneath the headline' }))
    const investigation = document.getElementById('investigation')!
    expect(investigation).toHaveTextContent('Harbor')
    expect(investigation.textContent).not.toMatch(/tutoring|\bsites?\b|students|pass rate/i)
    expect(screen.getByTestId('finding')).not.toHaveTextContent('So why')
  })

  test('an invalid upload shows specific errors and leaves the page unchanged', async () => {
    const user = userEvent.setup()
    render(<App />)
    await upload(user, 'bad.csv', SAMPLE.replace('previous,Harbor', 'Previous,Harbor'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('bad.csv couldn\'t be analyzed')
    expect(alert).toHaveTextContent('Row 2: period is "Previous". Use exactly "previous" or "current" (lowercase).')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pass rates are up 4 points.')
  })

  test('return to the example restores the flagship', async () => {
    const user = userEvent.setup()
    render(<App />)
    await upload(user, 'my-data.csv', SAMPLE)
    await screen.findByText('Your file: my-data.csv')
    await user.click(screen.getByRole('button', { name: 'Return to the example' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pass rates are up 4 points.')
    expect(screen.getByText('Fictional example data')).toBeInTheDocument()
  })
})
