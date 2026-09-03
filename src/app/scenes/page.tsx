import { AppShell } from '@/components/app-shell/app-shell'
import { SceneLibrary } from '@/features/scenes/scene-library'

export const metadata = { title: '场景库' }

export default function ScenesPage() {
  return <AppShell activeDestination="scenes"><SceneLibrary /></AppShell>
}
