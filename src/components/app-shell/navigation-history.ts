import { semanticRouteIdentity } from './learning-routes'
const MAX_ROUTES = 24

export function trackRoute(stack: string[], nextRoute: string) {
  if (stack.at(-1) === nextRoute) return { stack, kind: 'same' as const }
  const previous = stack.lastIndexOf(nextRoute)
  if (previous >= 0) {
    return { stack: stack.slice(0, previous + 1), kind: 'back' as const }
  }
  if (
    stack.at(-1) &&
    semanticRouteIdentity(stack.at(-1)!) === semanticRouteIdentity(nextRoute)
  ) {
    return {
      stack: [...stack.slice(0, -1), nextRoute],
      kind: 'same' as const,
    }
  }
  return {
    stack: [...stack, nextRoute].slice(-MAX_ROUTES),
    kind: 'forward' as const,
  }
}

export function canGoBackWithinApp(stack: string[]) {
  return stack.length > 1
}
