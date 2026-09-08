import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="landing-hero" aria-labelledby="landing-title">
        <p className="eyebrow">SpeakMate · 口语搭子</p>
        <h1 id="landing-title" data-page-title tabIndex={-1}>
          随时开口，练真实英语
        </h1>
        <p className="landing-copy">
          从 A1 到 C1，用丰富的生活、旅行、职场和社交场景，把“会做题”练成“能开口”。
        </p>
        <Link className="primary-link" href="/welcome">
          开始免费练习
        </Link>
        <p className="trust-copy">无需登录 · 不绑定付费 · 练习记录优先保存在本机</p>
      </section>
    </main>
  )
}
