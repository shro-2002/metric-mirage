import { DataPanel } from './components/DataPanel'
import { HeadlineBlock } from './components/HeadlineBlock'
import { Investigation } from './components/Investigation'
import { Masthead } from './components/Masthead'
import { useInvestigation } from './useInvestigation'
import './App.css'

const INVESTIGATION_ID = 'investigation'

export function App() {
  const { source, version, analysis, terms, revealed, toggleReveal, loadUpload, returnToExample } = useInvestigation()
  const sourceLabel = source.kind === 'example' ? 'Fictional example data' : `Your file: ${source.fileName}`

  return (
    <>
      <Masthead />
      <main>
        <HeadlineBlock
          sourceVersion={version}
          analysis={analysis}
          terms={terms}
          sourceLabel={sourceLabel}
          isRevealed={revealed}
          investigationId={INVESTIGATION_ID}
          onToggle={toggleReveal}
        />
        {revealed && <Investigation id={INVESTIGATION_ID} analysis={analysis} terms={terms} />}
        <DataPanel
          activeFileName={source.kind === 'upload' ? source.fileName : null}
          onLoad={loadUpload}
          onReturnToExample={returnToExample}
        />
      </main>
      <footer className="footer page">
        <p>
          Metric Mirage describes how an overall rate changed between two periods. It does not establish causes or
          statistical significance. Your data stays in your browser.
        </p>
      </footer>
    </>
  )
}
