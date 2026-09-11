import { AppShell } from '@/components/app-shell/app-shell'

import { MobilePageHeader } from '@/components/app-shell/mobile-page-header'
import { InstallPrompt } from '@/components/install-prompt/install-prompt'

import styles from './install.module.css'

export const metadata = { title: '安装到手机' }

export default function InstallPage() {
  return (
    <AppShell activeDestination="me" contentOwnsMain>
      <main className={styles.page}>
        <MobilePageHeader
          title="安装到手机"
          eyebrow="像 APP 一样使用"
          fallbackHref="/me"
        />
        <section
          className={styles.content}
          aria-labelledby="install-guide-title"
        >
          <h2 id="install-guide-title">把练习放到主屏幕</h2>
          <p>
            安装后可像应用一样打开。公开资料与页面需先联网准备；准备完成的文字练习可在本机继续。麦克风、朗读与跟读取决于浏览器支持，不影响文字练习。
          </p>
          <p>
            安装不保证数据永久保留，也不保证
            Safari、主屏幕应用或不同设备自动迁移记录。先导出备份，并在文件 App
            确认保存。
          </p>
          <InstallPrompt mode="page" />
          <a className={styles.continue} href="/practice">
            先继续练习
          </a>
        </section>
      </main>
    </AppShell>
  )
}
