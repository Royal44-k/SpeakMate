const MAX_ROUTES = 24

function pathnameOf(route: string) {
  return route.split(/[?#]/, 1)[0]
}

export function trackRoute(stack: string[], nextRoute: string) {
  if (stack.at(-1) === nextRoute) return { stack, kind: 'same' as const }
  if (stack.at(-2) === nextRoute) {
    return { stack: stack.slice(0, -1), kind: 'back' as const }
  }
  if (stack.at(-1) && pathnameOf(stack.at(-1)!) === pathnameOf(nextRoute)) {
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
