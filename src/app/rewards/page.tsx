import { RewardHome } from '@/features/goals/reward-home'
import { AppShell } from '@/components/app-shell/app-shell'
export const metadata = { title: '数字奖励' }
export default function RewardsPage() {
  return (
    <AppShell activeDestination="goals" contentOwnsMain>
      <RewardHome />
    </AppShell>
  )
}
