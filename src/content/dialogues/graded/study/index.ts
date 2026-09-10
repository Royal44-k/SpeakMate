import type { CefrLevel } from '@/domain/scenes/types'
import type { GradedPack } from '../schema'
import { classIntroduction } from './class-introduction'
import { askTeacher } from './ask-teacher'
import { groupProject } from './group-project'
import { presentationQa } from './presentation-qa'
import { seminarDiscussion } from './seminar-discussion'
import { officeHours } from './office-hours'
export const studyPacks: Record<string, Record<CefrLevel, GradedPack>> = {
  'study-01': classIntroduction,
  'study-02': askTeacher,
  'study-03': groupProject,
  'study-04': presentationQa,
  'study-05': seminarDiscussion,
  'study-06': officeHours,
}
