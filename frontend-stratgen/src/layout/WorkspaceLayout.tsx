import './WorkspaceLayout.css'
import type { ReactNode } from 'react'

type WorkspaceLayoutProps = {
  sidebar: ReactNode
  content: ReactNode
}

function WorkspaceLayout({ sidebar, content }: WorkspaceLayoutProps) {
  return (
    <div className="workspace-layout">
      <aside className="workspace-sidebar">{sidebar}</aside>
      <main className="workspace-content">{content}</main>
    </div>
  )
}

export default WorkspaceLayout