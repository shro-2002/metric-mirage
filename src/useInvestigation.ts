import { useMemo, useState } from 'react'

import { tutoringExample } from './data/tutoring-example'
import { analyze } from './engine/analyze'
import { EXAMPLE_TERMS, UPLOAD_TERMS } from './engine/terms'
import type { Dataset } from './engine/types'

export type Source = { kind: 'example' } | { kind: 'upload'; fileName: string; dataset: Dataset }

/**
 * The page's only state: where the data came from, whether the investigation is
 * open, and a counter of data switches (used to move focus to the new headline).
 * Everything else (analysis, wording) is derived, never stored.
 */
export const useInvestigation = () => {
  const [source, setSource] = useState<Source>({ kind: 'example' })
  const [revealed, setRevealed] = useState(false)
  const [version, setVersion] = useState(0) // bumps on every data switch, even to a same-named file

  const dataset = source.kind === 'example' ? tutoringExample : source.dataset
  const analysis = useMemo(() => analyze(dataset), [dataset])
  const terms = source.kind === 'example' ? EXAMPLE_TERMS : UPLOAD_TERMS

  return {
    source,
    version,
    analysis,
    terms,
    revealed,
    toggleReveal: () => setRevealed((open) => !open),
    loadUpload: (fileName: string, uploaded: Dataset) => {
      setSource({ kind: 'upload', fileName, dataset: uploaded })
      setRevealed(false)
      setVersion((v) => v + 1)
    },
    returnToExample: () => {
      setSource({ kind: 'example' })
      setRevealed(false)
      setVersion((v) => v + 1)
    },
  }
}
