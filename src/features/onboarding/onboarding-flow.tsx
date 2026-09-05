'use client'

import { ArrowLeft, Check, Sparkle } from '@phosphor-icons/react'
import { useState } from 'react'

import type { CefrLevel, SceneCategory } from '@/domain/scenes/types'

import styles from './onboarding-flow.module.css'

export interface OnboardingChoices {
  level: CefrLevel
  goals: SceneCategory[]
  dailyMinutes: 5 | 10 | 15
}

const LEVELS: Array<{ value: CefrLevel; label: string; hint: string }> = [
  { value: 'A1', label: 'A1 入门', hint: '能说少量词句' },
  { value: 'A2', label: 'A2 基础', hint: '能处理简单日常交流' },
  { value: 'B1', label: 'B1 中级', hint: '能围绕熟悉话题交流' },
  { value: 'B2', label: 'B2 中高级', hint: '能解释、协商和表达立场' },
  { value: 'C1', label: 'C1 高级', hint: '希望提升精确度与策略' },
]

const GOALS: Array<{ value: SceneCategory; label: string }> = [
  { value: 'travel', label: '旅行' },
  { value: 'work', label: '职场' },
  { value: 'daily', label: '生活' },
  { value: 'social', label: '社交' },
  { value: 'study', label: '学习' },
  { value: 'dining', label: '餐饮购物' },
  { value: 'emergency', label: '应急表达' },
]

const SELF_ASSESSMENT = [
  '我能用简单句介绍自己和日常安排。',
  '我能在旅行中完成点单、入住和问路。',
  '我能解释一个计划，并回答“为什么”。',
  '我能礼貌表达异议并协商解决方案。',
  '我能处理隐含意图、语气和复杂追问。',
]

export function OnboardingFlow({
  onComplete,
  returnHref,
  initialChoices,
}: {
  onComplete?: (choices: OnboardingChoices) => void | Promise<void>
  returnHref?: string
  initialChoices?: OnboardingChoices
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [level, setLevel] = useState<CefrLevel>(initialChoices?.level ?? 'A2')
  const [goals, setGoals] = useState<SceneCategory[]>(initialChoices?.goals ?? ['travel'])
  const [dailyMinutes, setDailyMinutes] = useState<5 | 10 | 15>(initialChoices?.dailyMinutes ?? 5)
  const [goalConfirmed, setGoalConfirmed] = useState(false)
  const [quizIndex, setQuizIndex] = useState<number | null>(null)
  const [quizScore, setQuizScore] = useState(0)

  function chooseLevel(value: CefrLevel) {
    if (value === level) return
    setLevel(value)
    setStep(2)
  }

  function chooseGoal(value: SceneCategory) {
    if (goals.includes(value) && goalConfirmed) return
    if (!goals.includes(value)) setGoals([value])
    setGoalConfirmed(true)
    setStep(3)
  }

  function answerQuiz(confident: boolean) {
    if (quizIndex === null) return
    const nextScore = quizScore + (confident ? 1 : 0)
    if (quizIndex === SELF_ASSESSMENT.length - 1) {
      const recommended = LEVELS[Math.min(nextScore, 4)].value
      setLevel(recommended)
      setQuizIndex(null)
      setQuizScore(0)
      setStep(2)
      return
    }
    setQuizScore(nextScore)
    setQuizIndex(quizIndex + 1)
  }

  return (
    <div className={styles.flow}>
      <header className={styles.header}>
        <p className={styles.brand}>SPEAKMATE</p>
        <h1>今天想练什么？</h1>
        <p>用一分钟定好难度和目标，之后可随时修改。</p>
      </header>

      {quizIndex !== null ? (
        <section className={styles.panel} aria-labelledby="quiz-title">
          <div className={styles.panelTopline}>
            <button className={styles.backButton} type="button" onClick={() => setQuizIndex(null)} aria-label="返回水平选择">
              <ArrowLeft aria-hidden size={19} />
            </button>
            <span>{quizIndex + 1} / 5</span>
          </div>
          <h2 id="quiz-title">{SELF_ASSESSMENT[quizIndex]}</h2>
          <div className={styles.quizActions}>
            <button type="button" onClick={() => answerQuiz(true)}>这很像我</button>
            <button type="button" onClick={() => answerQuiz(false)}>暂时还做不到</button>
          </div>
        </section>
      ) : null}

      {quizIndex === null && step === 1 ? (
        <section className={styles.panel} aria-labelledby="level-title">
          <div className={styles.panelTopline}>
            {returnHref ? <a className={styles.backButton} href={returnHref} aria-label="返回我的练习"><ArrowLeft aria-hidden size={19} /></a> : <span />}
            <span>STEP 1 / 3</span>
          </div>
          <div className={styles.sectionHeading}>
            <div><span>01</span><h2 id="level-title">选择英语水平</h2></div>
            <button className={styles.recommendButton} type="button" onClick={() => setQuizIndex(0)}>
              <Sparkle aria-hidden size={17} weight="fill" />帮我推荐水平
            </button>
          </div>
          <div className={styles.optionList}>
            {LEVELS.map((item) => (
              <button key={item.value} type="button" aria-label={item.label} aria-pressed={level === item.value} className={level === item.value ? styles.optionSelected : styles.option} onClick={() => chooseLevel(item.value)}>
                <span><strong>{item.label}</strong><small>{item.hint}</small></span>
                {level === item.value ? <Check aria-hidden size={20} weight="bold" /> : null}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {quizIndex === null && step === 2 ? (
        <section className={styles.panel} aria-labelledby="goal-title">
          <div className={styles.panelTopline}>
            <button className={styles.backButton} type="button" onClick={() => setStep(1)} aria-label="返回选择英语水平"><ArrowLeft aria-hidden size={19} /></button>
            <span>STEP 2 / 3</span>
          </div>
          <div className={styles.sectionHeading}><div><span>02</span><h2 id="goal-title">选择首要目标</h2></div></div>
          <div className={styles.goalGrid}>
            {GOALS.map((goal) => (
              <button key={goal.value} type="button" aria-pressed={goals.includes(goal.value)} className={goals.includes(goal.value) ? styles.goalSelected : styles.goal} onClick={() => chooseGoal(goal.value)}>
                {goal.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {quizIndex === null && step === 3 ? (
        <section className={styles.panel} aria-labelledby="time-title">
          <div className={styles.panelTopline}>
            <button className={styles.backButton} type="button" onClick={() => setStep(2)} aria-label="返回选择首要目标"><ArrowLeft aria-hidden size={19} /></button>
            <span>STEP 3 / 3</span>
          </div>
          <div className={styles.sectionHeading}><div><span>03</span><h2 id="time-title">每天练多久？</h2></div></div>
          <div className={styles.timeGrid}>
            {([5, 10, 15] as const).map((minutes) => (
              <button key={minutes} type="button" aria-pressed={dailyMinutes === minutes} className={dailyMinutes === minutes ? styles.timeSelected : styles.time} onClick={() => setDailyMinutes(minutes)}>
                每天 {minutes} 分钟
              </button>
            ))}
          </div>
          <button className={styles.primaryButton} type="button" onClick={() => void onComplete?.({ level, goals, dailyMinutes })}>开始第一次练习</button>
        </section>
      ) : null}
    </div>
  )
}
