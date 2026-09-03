import { SessionReportView } from '@/features/practice/session-report'

export const metadata = { title: '场景复盘' }

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SessionReportView sessionId={id} />
}
