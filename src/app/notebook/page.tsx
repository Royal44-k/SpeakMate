import { NotebookHome } from '@/features/notebook/notebook-home'
import { AppShell } from '@/components/app-shell/app-shell'
export const metadata = { title: '记录簿' }
export default function NotebookPage() {
  return (
    <AppShell activeDestination="notebook" contentOwnsMain>
      <NotebookHome />
    </AppShell>
  )
}
