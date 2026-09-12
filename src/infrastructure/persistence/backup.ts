import type { LearnerDataExport, LearnerDataExportV2 } from './repositories'
import type { LocalStoragePort } from './storage'
import { backupSchema, MAX_BACKUP_BYTES } from './backup-schemas'
import { canonical } from './data-invariants'
import {
  exportState,
  importState,
  mergeStates,
  validateState,
  type RestoreCounts,
} from './backup-merge'

export interface RestorePreview {
  sourceVersion: 1 | 2
  counts: RestoreCounts
  conflicts: string[]
  warnings: string[]
  canImport: boolean
}
export interface RestoreResult {
  counts: RestoreCounts
  warnings: string[]
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength
}
async function readBackup(input: string | File): Promise<string> {
  if (typeof input === 'string') {
    if (byteLength(input) > MAX_BACKUP_BYTES)
      throw new Error('BACKUP_TOO_LARGE: 文件不能超过 10 MB。')
    return input
  }
  if (input.size > MAX_BACKUP_BYTES)
    throw new Error('BACKUP_TOO_LARGE: 文件不能超过 10 MB。')
  if (typeof input.text === 'function') return input.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('BACKUP_READ_FAILED'))
    reader.readAsText(input)
  })
}

export function createBackupPort(storage: LocalStoragePort) {
  const prepared = new WeakMap<
    RestorePreview,
    { input: LearnerDataExport; before: string }
  >()
  return {
    async previewRestore(input: string | File): Promise<RestorePreview> {
      const text = await readBackup(input)
      if (byteLength(text) > MAX_BACKUP_BYTES)
        throw new Error('BACKUP_TOO_LARGE')
      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        throw new Error('BACKUP_INVALID_JSON: 请选择 SpeakMate JSON 备份。')
      }
      const parsed = backupSchema.safeParse(json)
      if (!parsed.success)
        throw new Error(
          `BACKUP_INVALID: ${parsed.error.issues[0]?.path.join('.') || 'root'} ${parsed.error.issues[0]?.message}`,
        )
      const data = parsed.data as LearnerDataExport
      return storage
        .read((local) => {
          const incoming = importState(data, local)
          const merged = mergeStates(local, incoming.state)
          return {
            preview: {
              sourceVersion: data.schemaVersion,
              counts: merged.counts,
              conflicts: merged.conflicts,
              warnings: incoming.warnings,
              canImport: merged.conflicts.length === 0,
            },
            before: canonical(local),
          }
        })
        .then(({ preview, before }) => {
          prepared.set(preview, { input: data, before })
          return preview
        })
    },
    restoreLearnerData(preview: RestorePreview): Promise<RestoreResult> {
      const saved = prepared.get(preview)
      if (!saved)
        return Promise.reject(
          new Error('PREVIEW_INVALID: 请重新选择文件并预览。'),
        )
      return storage.change((local) => {
        if (canonical(local) !== saved.before)
          throw new Error('PREVIEW_STALE: 本机数据已变化，请重新预览后确认。')
        const incoming = importState(saved.input, local)
        const merged = mergeStates(local, incoming.state)
        if (merged.conflicts.length)
          throw new Error(merged.conflicts.join('\n'))
        Object.assign(local, merged.state)
        return { counts: merged.counts, warnings: incoming.warnings }
      })
    },
    exportLearnerData(): Promise<LearnerDataExportV2> {
      return exportLearnerData(storage)
    },
  }
}

/** Normal and recovery builds share the complete, bounded backup boundary. */
export function exportLearnerData(
  storage: Pick<LocalStoragePort, 'read'>,
): Promise<LearnerDataExportV2> {
  return storage.read((state) => {
    validateState(state)
    const data = exportState(state)
    // The exact downloaded representation must pass the same import boundary.
    const json = JSON.stringify(data)
    if (byteLength(json) > MAX_BACKUP_BYTES)
      throw new Error(
        'BACKUP_TOO_LARGE: 当前数据超过 10 MB，未生成无法恢复的备份。',
      )
    backupSchema.parse(JSON.parse(json))
    return data
  })
}
