import { useId, useRef, useState, type ChangeEvent } from 'react'

import { readCsvFile } from '../csv/parse-csv'
import type { ValidationError } from '../csv/validate'
import type { Dataset } from '../engine/types'
import './DataPanel.css'

type Props = {
  activeFileName: string | null
  onLoad: (fileName: string, dataset: Dataset) => void
  onReturnToExample: () => void
}

type Feedback = { kind: 'none' } | { kind: 'errors'; attempt: number; fileName: string; errors: ValidationError[] }

const EXAMPLE_ROWS = ['period,group,successes,total', 'previous,North,200,250', 'current,North,312,400', '…']

export function DataPanel({ activeFileName, onLoad, onReturnToExample }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'none' })
  const attempts = useRef(0)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // allow choosing the same file again after fixing it
    if (!file) return
    const result = await readCsvFile(file)
    if (result.ok) {
      setFeedback({ kind: 'none' })
      onLoad(file.name, result.dataset)
    } else {
      attempts.current += 1
      setFeedback({ kind: 'errors', attempt: attempts.current, fileName: file.name, errors: result.errors })
    }
  }

  return (
    <section id="your-data" className="data page" aria-labelledby="data-title">
      <div className="data__intro">
        <h2 id="data-title" className="data__title">
          Analyze your own CSV
        </h2>
        <p className="data__lede">
          Check your own number before you report it. A CSV with columns <code>period, group, successes, total</code>{' '}
          for two periods. Your file is read in this browser and never uploaded.
        </p>
      </div>

      <div className="data__body">
        <div className="data__format">
          <p className="data__downloads">
            <a href="./metric-mirage-template.csv" download>
              Download the template
            </a>
            <a href="./sample-consistent.csv" download>
              Download a second sample
            </a>
          </p>
          <details className="data__details">
            <summary className="data__summary">Accepted format and rules</summary>
            <figure className="data__figure">
              <pre className="data__sample num">{EXAMPLE_ROWS.join('\n')}</pre>
              <figcaption className="visually-hidden">Example of the accepted format, first rows</figcaption>
            </figure>
            <ul className="data__rules">
              <li>
                <code>period</code> is exactly <code>previous</code> or <code>current</code>.
              </li>
              <li>Every group has one row in each period; 2–50 groups.</li>
              <li>
                <code>successes</code> and <code>total</code> are whole numbers; successes never exceed total; total is
                at least 1.
              </li>
            </ul>
          </details>
        </div>

        <div className="data__upload">
          <input
            ref={inputRef}
            id={inputId}
            className="data__input"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            aria-describedby={feedback.kind === 'errors' ? `${inputId}-errors` : undefined}
          />
          <label htmlFor={inputId} className="data__choose">
            Choose a CSV file
          </label>

          {activeFileName && (
            <p className="data__active">
              Showing <strong>{activeFileName}</strong>.{' '}
              <button type="button" className="data__return" onClick={onReturnToExample}>
                Return to the example
              </button>
            </p>
          )}

          {feedback.kind === 'errors' && (
            // A fresh key per attempt re-creates the alert so a repeated failure is announced again.
            <div key={feedback.attempt} id={`${inputId}-errors`} className="data__errors" role="alert">
              <p className="data__errors-title">
                {feedback.fileName} couldn't be analyzed. Nothing on the page changed. Fix the following and try again:
              </p>
              <ul>
                {feedback.errors.map((error) => (
                  <li key={`${error.row ?? 'file'}-${error.message}`}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
