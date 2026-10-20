import { HeadlineBlock } from './components/HeadlineBlock'
import { Investigation } from './components/Investigation'
import { Masthead } from './components/Masthead'
import { useInvestigation } from './useInvestigation'
import './App.css'

const INVESTIGATION_ID = 'investigation'

export function App() {
  const { source, analysis, terms, revealed, toggleReveal } = useInvestigation()
  const sourceLabel = source.kind === 'example' ? 'Fictional example data' : `Your file: ${source.fileName}`

  return (
    <>
      <Masthead />
      <main>
        <HeadlineBlock
          analysis={analysis}
          terms={terms}
          sourceLabel={sourceLabel}
          isRevealed={revealed}
          investigationId={INVESTIGATION_ID}
          onToggle={toggleReveal}
        />
        {revealed && <Investigation id={INVESTIGATION_ID} analysis={analysis} terms={terms} />}
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
