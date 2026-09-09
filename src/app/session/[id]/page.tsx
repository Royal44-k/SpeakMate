import { SessionResolver } from '@/features/practice/session-resolver'

export const metadata = { title: '对话练习' }

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ scene?: string; level?: string; from?: string; round?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  return (
    <SessionResolver
      requestedId={id}
      queryScene={query.scene}
      queryLevel={query.level}
      queryFrom={query.from}
      queryRound={query.round}
    />
  )
}
