import type { JobStatus } from '../../types/jobs'
import './GamePreview.css'

type GamePreviewProps = {
  iframeSrc: string | null
  title: string
  status: JobStatus | 'idle'
  hint: string
}

function GamePreview({ iframeSrc, title, status, hint }: GamePreviewProps) {
  const statusLabel = status === 'idle' ? 'Waiting' : status

  return (
    <div className="game-preview">
      <header className="game-preview__header">
        <div>
          <p className="game-preview__label">Preview</p>
          <h2>{title}</h2>
        </div>
        <span className="game-preview__status">{statusLabel}</span>
      </header>

      <div className="game-preview__frame-wrap">
        {iframeSrc ? (
          <iframe
            title="Generated game frame"
            src={iframeSrc}
            className="game-preview__frame"
            loading="lazy"
            allow="fullscreen"
          />
        ) : (
          <div className="game-preview__placeholder">
            <p>{hint}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GamePreview
