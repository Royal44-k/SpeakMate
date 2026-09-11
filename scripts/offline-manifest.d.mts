export interface OfflineArtifact { url: string; bytes: number; sha256: string }
export interface OfflineManifest { schemaVersion: number; buildId: string; shells: OfflineArtifact[]; assets: OfflineArtifact[]; categories: OfflineArtifact[] }
export function createOfflineManifest(root: string): Promise<OfflineManifest>
