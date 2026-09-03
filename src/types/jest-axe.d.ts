declare module 'jest-axe' {
  interface AxeResult {
    violations: Array<{
      id: string
      impact?: string | null
      description: string
    }>
  }

  export function axe(html: Element): Promise<AxeResult>
}
