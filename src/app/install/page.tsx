import Link from 'next/link'

import { MobilePageHeader } from '@/components/app-shell/mobile-page-header'
import { InstallPrompt } from '@/components/install-prompt/install-prompt'

import styles from './install.module.css'

export const metadata = { title: '安装到手机' }

export default function InstallPage() {
  return (
    <main className={styles.page}>
      <MobilePageHeader title="安装到手机" eyebrow="像 APP 一样使用" fallbackHref="/me" />
      <section className={styles.content} aria-labelledby="install-guide-title">
        <h2 id="install-guide-title">把练习放到主屏幕</h2>
        <p>安装后可全屏打开，离线浏览已缓存的场景；语音与 AI 练习仍需网络。</p>
        <InstallPrompt mode="page" />
        <Link className={styles.continue} href="/practice">先继续练习</Link>
      </section>
    </main>
  )
}
