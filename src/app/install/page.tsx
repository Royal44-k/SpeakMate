import Link from 'next/link'

import { InstallPrompt } from '@/components/install-prompt/install-prompt'

export const metadata = { title: '安装到手机' }

export default function InstallPage() {
  return (
    <main className="landing-shell">
      <section className="landing-hero" aria-labelledby="install-title">
        <p className="eyebrow">像 App 一样使用</p>
        <h1 id="install-title">把练习放到主屏幕</h1>
        <p className="landing-copy">安装后可全屏打开，离线浏览已缓存的场景；语音与 AI 练习仍需网络。</p>
        <InstallPrompt />
        <p className="trust-copy"><Link href="/practice">先继续练习</Link></p>
      </section>
    </main>
  )
}
