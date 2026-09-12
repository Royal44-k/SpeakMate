import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SpeakMate｜口语搭子',
    short_name: 'SpeakMate',
    description: '随时随地练习真实场景英语口语。',
    start_url:
      process.env.NEXT_PUBLIC_RECOVERY_ONLY === 'true' ? '/recovery' : '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#fffdf8',
    theme_color: '#123b5d',
    categories: ['education', 'productivity'],
    lang: 'zh-CN',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts:
      process.env.NEXT_PUBLIC_RECOVERY_ONLY === 'true'
        ? []
        : [
            {
              name: '继续练习',
              short_name: '练习',
              description: '打开今天的英语口语练习',
              url: '/practice/today',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
            },
            {
              name: '浏览场景',
              short_name: '场景',
              description: '从全部英语对话场景中选择',
              url: '/scenes',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
            },
          ],
  }
}
