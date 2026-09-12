'use client'
/* eslint-disable @next/next/no-html-link-for-pages -- Binding offline-routing contract: static cross-shell document links do not request RSC. */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import { REWARDS, type DigitalReward } from '@/domain/goals/rewards'
import { summarizePoints } from '@/domain/goals/statistics'
import { DemoRanking } from '@/features/profile/demo-ranking'
import { ExitGuard } from '@/features/practice/exit-guard'
import styles from './goals.module.css'
import { useGoalInteraction } from './use-goal-interaction'
export function RewardHome({ repositories }: { repositories?: Repositories }) {
  const [repo] = useState(() => repositories ?? createIndexedDbRepositories())
  const [data, setData] = useState<Awaited<ReturnType<typeof load>>>(),
    [selected, setSelected] = useState<DigitalReward>(),
    [sheet, setSheet] = useState<DigitalReward>(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0)
  const lock = useRef(false),
    attempt = useRef<string | undefined>(undefined)
  useGoalInteraction(busy)
  const load = useCallback(async () => {
    const profile = await repo.profiles.ensureGuestProfile()
    const [state, settings] = await Promise.all([
      repo.learning.getState(profile.id),
      repo.learning.getSettings(),
    ])
    return { profile, state, settings }
  }, [repo])
  useEffect(() => {
    let active = true
    void load()
      .then((value) => {
        if (active) setData(value)
      })
      .catch(() => {
        if (active) setError('本机奖励暂未读取，请重试；数据没有清除。')
      })
    return () => {
      active = false
    }
  }, [load, retry])
  async function transact(reward: DigitalReward, apply = false) {
    if (!data || lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (apply) {
        await repo.learning.applyReward(
          data.profile.id,
          reward.id,
          new Date().toISOString(),
        )
        setMessage('已应用，下次打开对应页面仍保留。')
      } else {
        attempt.current ??= new Date().toISOString()
        const result = await repo.learning.redeemReward(
          data.profile.id,
          reward.id,
          attempt.current,
        )
        setMessage(
          result.status === 'already-owned'
            ? '这份奖励已拥有，没有重复扣分。'
            : '兑换成功，已保存到本机。',
        )
        setSelected(undefined)
        attempt.current = undefined
      }
      setData(await load())
    } catch (e) {
      setError(
        e instanceof Error && e.message === 'INSUFFICIENT_POINTS'
          ? '余额不足，本次未兑换。可以先继续练习。'
          : '本机保存未确认，请重试并查看已拥有状态；不会额外扣分。',
      )
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  if (!data)
    return (
      <main className={styles.page}>
        <h1>数字奖励</h1>
        {error ? (
          <p role="alert">{error}</p>
        ) : (
          <p role="status">读取本机奖励…</p>
        )}
        <button onClick={() => setRetry((n) => n + 1)}>重试读取</button>
      </main>
    )
  const points = summarizePoints(data.state.pointsLedger)
  return (
    <main className={styles.page}>
      <ExitGuard
        state={busy ? 'processing' : 'clean'}
        fallbackHref="/"
        ariaLabel="返回今日目标"
        onConfirmExit={() => {}}
      />
      <header className={styles.header}>
        <p className={styles.eyebrow}>SMALL STEPS, YOUR SPACE</p>
        <h1 data-page-title tabIndex={-1}>
          数字奖励
        </h1>
        <p>
          累计获得 {points.earned} · 可兑换余额 {points.available}
        </p>
        <p>只使用本机练习积分，无付款。所有核心学习内容始终开放。</p>
      </header>
      {message ? <p role="status">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {selected ? (
        <section aria-label="确认兑换" className={styles.card}>
          <h2>兑换「{selected.title}」？</h2>
          <p>
            扣除 {selected.price} 积分，余额将为{' '}
            {points.available - selected.price}；累计获得不变。
          </p>
          <div className={styles.actions}>
            <button disabled={busy} onClick={() => void transact(selected)}>
              确认兑换
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setSelected(undefined)
                attempt.current = undefined
                setError('')
              }}
            >
              取消
            </button>
          </div>
        </section>
      ) : null}
      {REWARDS.map((reward) => {
        const owned = data.state.rewardUnlocks.some(
            (item) => item.rewardId === reward.id,
          ),
          applied =
            data.settings.appliedGoalCover === reward.id ||
            data.settings.appliedProfileStyle === reward.id
        return (
          <article
            aria-label={reward.title}
            className={styles.card}
            key={reward.id}
          >
            <h2>{reward.title}</h2>
            <p>{reward.description}</p>
            <p>{owned ? '已拥有' : `${reward.price} 积分`}</p>
            {owned ? (
              reward.kind === 'sheet' ? (
                <button onClick={() => setSheet(reward)}>阅读练习资料</button>
              ) : applied ? (
                <p>正在使用</p>
              ) : (
                <button
                  disabled={busy}
                  onClick={() => void transact(reward, true)}
                >
                  应用
                </button>
              )
            ) : (
              <button
                disabled={busy || points.available < reward.price}
                onClick={() => {
                  setSelected(reward)
                  attempt.current = undefined
                  setError('')
                }}
              >
                兑换 · {reward.price} 积分
              </button>
            )}
          </article>
        )
      })}
      {sheet ? (
        <section className={styles.card} aria-label={sheet.title}>
          <h2>{sheet.title}</h2>
          {sheet.content?.split('\n').map((line, index) => (
            <p key={index} lang={/^[A-Za-z]/.test(line) ? 'en' : 'zh-CN'}>
              {line}
            </p>
          ))}
          <button onClick={() => setSheet(undefined)}>收起资料</button>
        </section>
      ) : null}
      <section className={styles.card}>
        <h2>兑换记录</h2>
        {data.state.rewardUnlocks.length ? (
          <ul>
            {data.state.rewardUnlocks.map((item) => (
              <li key={item.id}>
                {REWARDS.find((r) => r.id === item.rewardId)?.title} ·{' '}
                {item.unlockedAt.slice(0, 10)}
              </li>
            ))}
          </ul>
        ) : (
          <p>还没有兑换记录。积分不是对语言能力的评分。</p>
        )}
      </section>
      <DemoRanking />
      <div className={styles.actions}>
        <a data-return-to-source href="/">
          返回今日目标
        </a>
        <a href="/me">查看我的个人卡</a>
        <a href="/guide">本机练习指南</a>
      </div>
    </main>
  )
}
