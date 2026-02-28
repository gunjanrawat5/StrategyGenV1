import './GamePreview.css'
import type { JobStatus } from '../../types/jobs'

type GamePreviewProps = {
  iframeSrc: string | null
  title: string
  status: JobStatus | 'idle'
  hint: string
}

function GamePreview({ iframeSrc, title, status, hint }: GamePreviewProps) {
  return (
    <section className="game-preview">
      <header className="game-preview__header">
        <h1>{title}</h1>
        <span className={`game-preview__status game-preview__status--${status}`}>{status}</span>
      </header>

      <p className="game-preview__hint">{hint}</p>

      <div className="game-preview__frame-wrap">
        {iframeSrc ? (
          <iframe title={title} src={iframeSrc} className="game-preview__frame" />
        ) : (
          <div className="game-preview__placeholder">No game loaded yet.</div>
        )}
      </div>
    </section>
  )
}

export default GamePreview