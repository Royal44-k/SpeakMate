import { CloudCheck, MicrophoneSlash, ShieldCheck } from '@phosphor-icons/react/dist/ssr'

import { MobilePageHeader } from '@/components/app-shell/mobile-page-header'
import { DataControls } from '@/features/profile/data-controls'

import styles from './privacy.module.css'

export const metadata = { title: '隐私与数据' }

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <MobilePageHeader title="隐私与数据" eyebrow="PRIVACY FIRST" fallbackHref="/me" />
      <section className={styles.promise}>
        <article><MicrophoneSlash aria-hidden size={25} /><div><h2>原始录音不保存</h2><p>音频只在本轮请求内短暂使用；结束、失败或取消后释放。</p></div></article>
        <article><ShieldCheck aria-hidden size={25} /><div><h2>游客优先</h2><p>不要求昵称、头像、手机号或微信账号；学习记录默认留在本机。</p></div></article>
        <article><CloudCheck aria-hidden size={25} /><div><h2>同步始终可选</h2><p>只有部署者配置同步且你主动登录后，文字记录才会进入云端。</p></div></article>
      </section>
      <section className={styles.detail}><h2>云端智能说明</h2><p>基础反馈完全可在无密钥模式运行。启用云端智能时，本轮音频或确认后的转写会发送给配置的 AI 服务，用于转写和生成反馈；应用不记录厂商密钥和完整对话日志。</p></section>
      <DataControls />
      <footer><p>面向中国大陆公开运营前，仍需完成备案、隐私政策、数据跨境与生成式 AI 合规评估。本测试部署不等于公开运营许可。</p></footer>
    </main>
  )
}
