import { Suspense } from 'react'

import { AppShell } from '@/components/app-shell/app-shell'
import { SceneLibraryRoute } from '@/features/scenes/scene-library-route'

export const metadata = { title: '场景库' }

export default function ScenesPage() {
  return (
    <AppShell activeDestination="scenes">
      <Suspense
        fallback={
          <main aria-busy="true" aria-label="场景库加载中">
            正在加载场景库…
          </main>
        }
      >
        <SceneLibraryRoute />
      </Suspense>
    </AppShell>
  )
}
