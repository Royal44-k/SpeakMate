'use client'

import { DownloadSimple, Export, PlusSquare, X } from '@phosphor-icons/react'
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from 'react'

import styles from './install-prompt.module.css'

export type InstallPlatform = 'ios' | 'android' | 'wechat' | 'unknown'

type InstallMode = 'page' | 'prompt'
type ManualGuide = 'ios' | 'android'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallPromptProps {
  platform?: InstallPlatform | 'auto'
  standalone?: boolean
  mode?: InstallMode
}

const DISMISSAL_KEY = 'speakmate-install-dismissed-at'
const IMPRESSIONS_KEY = 'speakmate-install-impressions'
const DISMISSAL_DAYS = 14

export function InstallPrompt({
  platform = 'auto',
  standalone,
  mode = 'prompt',
}: InstallPromptProps) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent>()
  const [dismissed, setDismissed] = useState(false)
  const [installCompleted, setInstallCompleted] = useState(false)
  const installed = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false)
  const detectedPlatform = useSyncExternalStore(noopSubscribe, detectPlatform, () => 'unknown')
  const suppressedByHistory = useSyncExternalStore(
    mode === 'prompt' ? subscribeStorage : noopSubscribe,
    mode === 'prompt' ? isSuppressedByHistory : () => false,
    () => false,
  )
  const resolvedPlatform = platform === 'auto'
    ? installEvent ? 'android' : detectedPlatform
    : platform
  const preferredGuide: ManualGuide = resolvedPlatform === 'android' ? 'android' : 'ios'
  const [selectedGuide, setSelectedGuide] = useState<ManualGuide | null>(null)
  const activeGuide = selectedGuide ?? preferredGuide
  const isInstalled = standalone === true || installed || installCompleted

  useEffect(() => {
    if (mode === 'prompt') {
      const impressions = Number(localStorage.getItem(IMPRESSIONS_KEY) ?? 0)
      if (!isInstalled && !suppressedByHistory) localStorage.setItem(IMPRESSIONS_KEY, String(impressions + 1))
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [isInstalled, mode, suppressedByHistory])

  if (mode === 'prompt' && (isInstalled || dismissed || suppressedByHistory || resolvedPlatform === 'unknown')) {
    return null
  }

  async function install() {
    if (!installEvent) return
    await installEvent.prompt()
    const result = await installEvent.userChoice
    if (result.outcome === 'accepted') setInstallCompleted(true)
  }

  function dismiss() {
    localStorage.setItem(DISMISSAL_KEY, String(Date.now()))
    setDismissed(true)
  }

  function selectGuideFromKeyboard(
    event: KeyboardEvent<HTMLButtonElement>,
  ) {
    let nextGuide: ManualGuide | undefined
    if (event.key === 'ArrowLeft') {
      nextGuide = activeGuide === 'ios' ? 'android' : 'ios'
    } else if (event.key === 'ArrowRight') {
      nextGuide = activeGuide === 'android' ? 'ios' : 'android'
    } else if (event.key === 'Home') {
      nextGuide = 'ios'
    } else if (event.key === 'End') {
      nextGuide = 'android'
    }
    if (!nextGuide) return

    event.preventDefault()
    setSelectedGuide(nextGuide)
    document.getElementById(`install-tab-${nextGuide}`)?.focus()
  }

  const heading = isInstalled ? '已安装到主屏幕' : '添加 SpeakMate 到主屏幕'
  const tabId = `install-tab-${activeGuide}`
  const panelId = `install-panel-${activeGuide}`

  return (
    <section className={`${styles.prompt} ${mode === 'page' ? styles.pageGuide : ''}`} aria-labelledby="install-heading">
      <div className={styles.headingRow}>
        <DownloadSimple aria-hidden size={22} weight="bold" />
        <h2 id="install-heading">{heading}</h2>
        {mode === 'prompt' ? (
          <button className={styles.close} type="button" onClick={dismiss} aria-label="关闭安装提示">
            <X aria-hidden size={19} />
          </button>
        ) : null}
      </div>

      {isInstalled ? <p className={styles.installed} role="status">SpeakMate 已可从主屏幕像 App 一样打开。</p> : (
        <>
          {resolvedPlatform === 'wechat' ? <p className={styles.browserNotice}>请使用 Safari 或系统浏览器打开</p> : null}
          <div className={styles.tabs} role="tablist" aria-label="选择设备">
            <button
              id="install-tab-ios"
              className={styles.tab}
              type="button"
              role="tab"
              tabIndex={activeGuide === 'ios' ? 0 : -1}
              aria-selected={activeGuide === 'ios'}
              aria-controls="install-panel-ios"
              onClick={() => setSelectedGuide('ios')}
              onKeyDown={selectGuideFromKeyboard}
            >
              iPhone
            </button>
            <button
              id="install-tab-android"
              className={styles.tab}
              type="button"
              role="tab"
              tabIndex={activeGuide === 'android' ? 0 : -1}
              aria-selected={activeGuide === 'android'}
              aria-controls="install-panel-android"
              onClick={() => setSelectedGuide('android')}
              onKeyDown={selectGuideFromKeyboard}
            >
              Android
            </button>
          </div>
          <div id={panelId} className={styles.guidePanel} role="tabpanel" aria-labelledby={tabId}>
            {activeGuide === 'ios' ? <IosGuide /> : <AndroidGuide />}
          </div>

          {installEvent && activeGuide === 'android' ? (
            <button className={styles.install} type="button" onClick={() => void install()}>立即安装</button>
          ) : null}
        </>
      )}

      {mode === 'prompt' && !isInstalled ? (
        <div className={styles.actions}>
          <button className={styles.later} type="button" onClick={dismiss}>暂时不用</button>
        </div>
      ) : null}
    </section>
  )
}

function IosGuide() {
  return (
    <ol className={styles.steps}>
      <li><Export aria-hidden size={19} />打开 Safari 的分享菜单</li>
      <li><PlusSquare aria-hidden size={19} />选择“添加到主屏幕”</li>
      <li><PlusSquare aria-hidden size={19} />确认名称并点“添加”</li>
    </ol>
  )
}

function AndroidGuide() {
  return (
    <ol className={styles.steps}>
      <li><DownloadSimple aria-hidden size={19} />打开 Chrome 或系统浏览器的菜单</li>
      <li><PlusSquare aria-hidden size={19} />选择“安装应用或添加到主屏幕”</li>
      <li><PlusSquare aria-hidden size={19} />在系统提示中确认安装或添加</li>
    </ol>
  )
}

function detectPlatform(): InstallPlatform {
  const agent = navigator.userAgent.toLowerCase()
  if (/micromessenger/.test(agent)) return 'wechat'
  if (/iphone|ipad|ipod/.test(agent)) return 'ios'
  if (/android/.test(agent)) return 'android'
  return 'unknown'
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
