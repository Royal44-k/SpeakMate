'use client'

import { DownloadSimple, Export, PlusSquare, X } from '@phosphor-icons/react'
import { useEffect, useState, useSyncExternalStore } from 'react'

import styles from './install-prompt.module.css'

type InstallPlatform = 'auto' | 'ios' | 'chromium' | 'unsupported'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallPromptProps {
  platform?: InstallPlatform
  standalone?: boolean
}

const DISMISSAL_KEY = 'speakmate-install-dismissed-at'
const IMPRESSIONS_KEY = 'speakmate-install-impressions'
const DISMISSAL_DAYS = 14

export function InstallPrompt({
  platform = 'auto',
  standalone,
}: InstallPromptProps) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent>()
  const [dismissed, setDismissed] = useState(false)
  const installed = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false)
  const detectedPlatform = useSyncExternalStore(noopSubscribe, detectPlatform, () => 'unsupported')
  const suppressedByHistory = useSyncExternalStore(subscribeStorage, isSuppressedByHistory, () => false)
  const resolvedPlatform = installEvent
    ? 'chromium'
    : platform === 'auto'
      ? detectedPlatform
      : platform

  useEffect(() => {
    const impressions = Number(localStorage.getItem(IMPRESSIONS_KEY) ?? 0)
    if (!installed && !suppressedByHistory) localStorage.setItem(IMPRESSIONS_KEY, String(impressions + 1))

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () =>
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [installed, suppressedByHistory])

  if (standalone === true || installed || dismissed || suppressedByHistory || resolvedPlatform === 'unsupported') return null

  async function install() {
    if (!installEvent) return
    await installEvent.prompt()
    const result = await installEvent.userChoice
    if (result.outcome === 'accepted') setDismissed(true)
  }

  function dismiss() {
    localStorage.setItem(DISMISSAL_KEY, String(Date.now()))
    setDismissed(true)
  }

  return (
    <aside className={styles.prompt} aria-labelledby="install-heading">
      <div className={styles.headingRow}>
        <DownloadSimple aria-hidden size={22} weight="bold" />
        <h2 id="install-heading">添加 SpeakMate 到主屏幕</h2>
        <button className={styles.close} type="button" onClick={dismiss} aria-label="关闭安装提示">
          <X aria-hidden size={19} />
        </button>
      </div>

      {resolvedPlatform === 'ios' ? (
        <ol className={styles.steps}>
          <li><Export aria-hidden size={19} />打开 Safari 的分享菜单</li>
          <li><PlusSquare aria-hidden size={19} />选择“添加到主屏幕”</li>
        </ol>
      ) : (
        <p className={styles.description}>像普通 App 一样从主屏幕打开，也能使用离线场景库。</p>
      )}

      <div className={styles.actions}>
        {resolvedPlatform === 'chromium' && installEvent ? (
          <button className={styles.install} type="button" onClick={install}>立即安装</button>
        ) : null}
        <button className={styles.later} type="button" onClick={dismiss}>暂时不用</button>
      </div>
    </aside>
  )
}

function detectPlatform(): InstallPlatform {
  const agent = navigator.userAgent.toLowerCase()
  const isIos = /iphone|ipad|ipod/.test(agent)
  return isIos ? 'ios' : 'unsupported'
}

function isStandalone(): boolean {
  return (
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

function subscribeDisplayMode(callback: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined
  const media = window.matchMedia('(display-mode: standalone)')
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function subscribeStorage(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function noopSubscribe() {
  return () => undefined
}

function isSuppressedByHistory() {
  const dismissedAt = Number(localStorage.getItem(DISMISSAL_KEY) ?? 0)
  const dismissedRecently = Date.now() - dismissedAt < DISMISSAL_DAYS * 24 * 60 * 60 * 1000
  return dismissedRecently || Number(localStorage.getItem(IMPRESSIONS_KEY) ?? 0) >= 3
}
