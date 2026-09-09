/**
 * Release-level safety gate. Future remote adapters remain in the codebase, but
 * no environment value can activate them in the strict-local product.
 */
export function remoteLearningServicesEnabled(): boolean {
  return false
}
