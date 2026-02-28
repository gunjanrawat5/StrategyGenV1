import './WorkspaceLayout.css'
import type { ReactNode } from 'react'

type WorkspaceLayoutProps = {
  sidebar: ReactNode
  content: ReactNode
}

function WorkspaceLayout({ sidebar, content }: WorkspaceLayoutProps) {
  return (
    <main className="workspace">
      <aside className="workspace__sidebar">{sidebar}</aside>
      <section className="workspace__content">{content}</section>
    </main>
  )
}

export default WorkspaceLayout
