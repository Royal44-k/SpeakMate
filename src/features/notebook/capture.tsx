'use client'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type { Repositories } from '@/infrastructure/persistence/repositories'
import type { PracticeCaptureSource } from '@/domain/practice/graded-presenter'
import type {
  NotebookKind,
  NotebookSourceSnapshot,
} from '@/domain/notebook/types'
import { savedNotebookHref } from '@/components/app-shell/learning-routes'
import styles from './notebook.module.css'

type Capture = {
  text: string
  wholeText: string
  source: Partial<PracticeCaptureSource>
  trigger: HTMLElement
}
const CaptureContext = createContext<((capture: Capture) => void) | null>(null)
export function selectedBlockText(element: HTMLElement): string | undefined {
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    const start = element.selectionStart
    const end = element.selectionEnd
    return start !== null && end !== null && start !== end
      ? element.value.slice(start, end)
      : undefined
  }
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return
  const range = selection.getRangeAt(0)
  if (
    !element.contains(range.startContainer) ||
    !element.contains(range.endContainer)
  )
    return
  return selection.toString().trim() || undefined
}
function inferKind(text: string): NotebookKind {
  if (text.trim().split(/\s+/u).length === 1) return 'word'
  return /[.!?。！？]$/u.test(text.trim()) ? 'sentence' : 'phrase'
}
export function CaptureProvider({
  children,
  repositories,
  onBusyChange,
}: {
  children: ReactNode
  repositories: Repositories
  onBusyChange?: (busy: boolean) => void
}) {
  const [capture, setCapture] = useState<Capture>()
  const [text, setText] = useState('')
  const [kind, setKind] = useState<NotebookKind>('sentence')
  const [choosing, setChoosing] = useState(false)
  const [chosen, setChosen] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] =
    useState<Awaited<ReturnType<Repositories['notebook']['capture']>>>()
  const dialog = useRef<HTMLDialogElement>(null)
  const editor = useRef<HTMLTextAreaElement>(null)
  const pending = useRef(false)
  useEffect(() => {
    onBusyChange?.(!!capture)
    return () => onBusyChange?.(false)
  }, [capture, onBusyChange])
  useEffect(() => {
    if (!capture || !dialog.current) return
    const current = dialog.current
    if (typeof current.showModal === 'function') current.showModal()
    else current.setAttribute('open', '')
    editor.current?.focus()
    return () => {
      if (typeof current.close === 'function') current.close()
      capture.trigger.focus({ preventScroll: true })
    }
  }, [capture])
  function open(next: Capture) {
    setCapture(structuredCapture(next))
    setText(next.text)
    setKind(inferKind(next.text))
    setChoosing(false)
    setChosen([])
    setError('')
    setResult(undefined)
  }
  async function save() {
    if (!capture || pending.current || !text.trim()) return
    pending.current = true
    setSaving(true)
    setError('')
    const original = capture
    try {
      const profile = await repositories.profiles.ensureGuestProfile()
      const at = new Date().toISOString()
      const source: NotebookSourceSnapshot = {
        ...original.source,
        id: crypto.randomUUID(),
        kind: original.source.sessionId ? 'turn' : 'manual',
        originalText: original.wholeText,
        createdAt: at,
      }
      const saved = await repositories.notebook.capture({
        id: crypto.randomUUID(),
        profileId: profile.id,
        kind,
        text: text.trim(),
        normalizedText: '',
        notes: '',
        tags: [],
        favoriteIds: [],
        sources: [source],
        createdAt: at,
        updatedAt: at,
      })
      setResult(saved)
      setCapture(undefined)
    } catch {
      setError('词句未保存，请重试；待存原文仍保留。')
    } finally {
      pending.current = false
      setSaving(false)
    }
  }
  async function undo() {
    if (!result || pending.current) return
    pending.current = true
    try {
      await repositories.notebook.undoCapture(
        result.receipt,
        new Date().toISOString(),
      )
      setResult(undefined)
      setError('已撤销本次记录。')
    } catch {
      setError(
        '记录已有后续修改，无法安全撤销。已保留最新数据，请在记录簿查看。',
      )
    } finally {
      pending.current = false
    }
  }
  const href =
    result &&
    savedNotebookHref(
      result.entry.id,
      window.location.pathname + window.location.search,
    )
  return (
    <CaptureContext.Provider value={open}>
      {children}
      {result ? (
        <aside className={styles.notice} role="status">
          <p>{result.duplicate ? '已存在，已补充来源' : '已记录'}</p>
          {href ? (
            <a href={href}>查看词句</a>
          ) : (
            <p>
              此保留编号不能直接链接，请到记录簿在此查看；原文与导出仍可用。
            </p>
          )}
          <button onClick={() => void undo()}>撤销记录</button>
        </aside>
      ) : null}
      {!capture && error ? (
        <p role="status" className={styles.notice}>
          {error}
        </p>
      ) : null}
      {capture
        ? createPortal(
            <dialog
              ref={dialog}
              className={styles.captureDialog}
              aria-labelledby="capture-title"
              onCancel={(event) => {
                event.preventDefault()
                if (!saving) setCapture(undefined)
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Tab') return
                const focusable = Array.from(
                  dialog.current!.querySelectorAll<HTMLElement>(
                    'button:not([disabled]),textarea:not([disabled]),select:not([disabled])',
                  ),
                )
                const first = focusable[0]
                const last = focusable.at(-1)
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault()
                  last?.focus()
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault()
                  first?.focus()
                }
              }}
            >
              <h2 id="capture-title">记录词句预览</h2>
              <p>
                来源：{capture.source.sceneId ?? '手动记录'} ·{' '}
                {capture.source.level ?? '等级未保存'}
                {capture.source.questionId
                  ? ` · ${capture.source.questionId}`
                  : ' · 题目语境未保存'}
              </p>
              <label>
                待存原文
                <textarea
                  ref={editor}
                  disabled={saving}
                  value={text}
                  maxLength={20000}
                  onChange={(event) => setText(event.target.value)}
                />
              </label>
              <label>
                词句类型
                <select
                  value={kind}
                  disabled={saving}
                  onChange={(event) =>
                    setKind(event.target.value as NotebookKind)
                  }
                >
                  <option value="word">单词</option>
                  <option value="phrase">短语</option>
                  <option value="sentence">整句</option>
                </select>
              </label>
              <div className={styles.actions}>
                <button
                  disabled={saving}
                  onClick={() => {
                    setChoosing(!choosing)
                    setChosen([])
                  }}
                >
                  选词
                </button>
                <button
                  disabled={saving}
                  onClick={() => {
                    setText(capture.wholeText)
                    setKind(inferKind(capture.wholeText))
                  }}
                >
                  使用整句
                </button>
              </div>
              {choosing ? (
                <div className={styles.words} aria-label="点选词语">
                  {capture.wholeText.split(/\s+/u).map((word, index) => (
                    <button
                      key={index}
                      disabled={saving}
                      aria-pressed={chosen.includes(index)}
                      onClick={() => {
                        const next = chosen.includes(index)
                          ? chosen.filter((n) => n !== index)
                          : [...chosen, index].sort((a, b) => a - b)
                        setChosen(next)
                        const words = capture.wholeText.split(/\s+/u)
                        const value = next.map((n) => words[n]).join(' ')
                        setText(value)
                        setKind(inferKind(value))
                      }}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              ) : null}
              {error ? <p role="alert">{error}</p> : null}
              <div className={styles.actions}>
                <button disabled={saving} onClick={() => setCapture(undefined)}>
                  取消
                </button>
                <button
                  disabled={saving || !text.trim()}
                  onClick={() => void save()}
                >
                  {saving ? '正在保存…' : '保存词句'}
                </button>
              </div>
            </dialog>,
            document.body,
          )
        : null}
    </CaptureContext.Provider>
  )
}
function structuredCapture(capture: Capture): Capture {
  return { ...capture, source: structuredClone(capture.source) }
}
export function CaptureText({
  text,
  source,
  label,
}: {
  text: string
  source: Partial<PracticeCaptureSource>
  label?: string
}) {
  const open = useContext(CaptureContext)
  const block = useRef<HTMLParagraphElement>(null)
  const selected = useRef<Omit<Capture, 'trigger'> | undefined>(undefined)
  const pressed = useRef<Omit<Capture, 'trigger'> | undefined>(undefined)
  useEffect(() => {
    const snapshot = () => {
      const value = block.current ? selectedBlockText(block.current) : undefined
      selected.current = value
        ? { text: value, wholeText: text, source: structuredClone(source) }
        : undefined
    }
    document.addEventListener('selectionchange', snapshot)
    return () => document.removeEventListener('selectionchange', snapshot)
  }, [text, source])
  if (!text.trim()) return null
  return (
    <div className={styles.captureBlock} data-capture-block>
      {label ? <small>{label}</small> : null}
      <p ref={block} lang="en">
        {text}
      </p>
      {open ? (
        <button
          type="button"
          onPointerDown={() => {
            const value = block.current
              ? selectedBlockText(block.current)
              : undefined
            pressed.current =
              selected.current ??
              (value
                ? {
                    text: value,
                    wholeText: text,
                    source: structuredClone(source),
                  }
                : undefined)
          }}
          onClick={(event) => {
            open({
              ...(pressed.current ??
                selected.current ?? { text, wholeText: text, source }),
              trigger: event.currentTarget,
            })
            pressed.current = undefined
            selected.current = undefined
          }}
        >
          记录词句
        </button>
      ) : null}
    </div>
  )
}
