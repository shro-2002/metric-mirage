import { useMemo, useState } from 'react'

import { tutoringExample } from './data/tutoring-example'
import { analyze } from './engine/analyze'
import { EXAMPLE_TERMS, UPLOAD_TERMS } from './engine/terms'
import type { Dataset } from './engine/types'

export type Source = { kind: 'example' } | { kind: 'upload'; fileName: string; dataset: Dataset }

/**
 * The page's only state: where the data came from, and whether the investigation
 * is open. Everything else (analysis, wording) is derived, never stored.
 */
export const useInvestigation = () => {
  const [source, setSource] = useState<Source>({ kind: 'example' })
  const [revealed, setRevealed] = useState(false)

  const dataset = source.kind === 'example' ? tutoringExample : source.dataset
  const analysis = useMemo(() => analyze(dataset), [dataset])
  const terms = source.kind === 'example' ? EXAMPLE_TERMS : UPLOAD_TERMS

  return {
    source,
    analysis,
    terms,
    revealed,
    toggleReveal: () => setRevealed((open) => !open),
    loadUpload: (fileName: string, uploaded: Dataset) => {
      setSource({ kind: 'upload', fileName, dataset: uploaded })
      setRevealed(false)
    },
    returnToExample: () => {
      setSource({ kind: 'example' })
      setRevealed(false)
    },
  }
}
