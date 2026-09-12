'use client'

import { usePathname } from 'next/navigation'
import { RouteCoordinator } from './route-coordinator'
import { ServiceWorkerRegistration } from '@/components/install-prompt/service-worker-registration'

/** The fixed recovery entry must never re-register the worker it is retiring. */
export function ApplicationRuntime() {
  const pathname = usePathname()
  if (
    pathname === '/recovery' ||
    process.env.NEXT_PUBLIC_RECOVERY_ONLY === 'true'
  )
    return null
  return (
    <>
      <RouteCoordinator />
      <ServiceWorkerRegistration />
    </>
  )
}
