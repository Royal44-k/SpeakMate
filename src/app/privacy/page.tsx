import {
  CloudCheck,
  MicrophoneSlash,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr'

import { MobilePageHeader } from '@/components/app-shell/mobile-page-header'
import { DataControls } from '@/features/profile/data-controls'
import { AppShell } from '@/components/app-shell/app-shell'

import styles from './privacy.module.css'

export const metadata = { title: '隐私与数据' }

export default function PrivacyPage() {
  return (
    <AppShell activeDestination="me" contentOwnsMain>
      <main className={styles.page}>
        <MobilePageHeader
          title="隐私与数据"
          eyebrow="PRIVACY FIRST"
          fallbackHref="/me"
        />
        <section className={styles.promise}>
          <article>
            <MicrophoneSlash aria-hidden size={25} />
            <div>
              <h2>原始录音不写入学习记录</h2>
              <p>
                录音核对或重试时可能保留临时录音；取消、提交结束、离开或组件卸载时释放。导出不含录音。
              </p>
            </div>
          </article>
          <article>
            <ShieldCheck aria-hidden size={25} />
            <div>
              <h2>游客优先</h2>
              <p>不要求昵称、头像、手机号或微信账号；学习记录默认留在本机。</p>
            </div>
          </article>
          <article>
            <CloudCheck aria-hidden size={25} />
            <div>
              <h2>本机私密学习</h2>
              <p>
                本版不连接云端智能、账号或自动同步；个人学习文字只保存在这个浏览器。
              </p>
            </div>
          </article>
        </section>
        <section className={styles.detail}>
          <h2>删除与备份范围</h2>
          <p>
            删除单条历史只删除会话与话轮。词句笔记和任务完成凭据可能仍含学习文字，计划、积分与奖励保留。需要彻底清除本机学习数据时，请在下方明确确认清空。
          </p>
          <p>
            Safari
            与主屏幕网页应用的数据可能分开，不能保证自动迁移。清理站点数据、换设备或系统回收空间都可能丢失记录；先导出并在文件
            App 确认保存，再操作。
          </p>
        </section>
        <DataControls />
        <footer>
          <p>
            面向中国大陆公开运营前，仍需完成备案、隐私政策、数据跨境与生成式 AI
            合规评估。本测试部署不等于公开运营许可。
          </p>
        </footer>
      </main>
    </AppShell>
  )
}
