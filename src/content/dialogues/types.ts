export interface DialogueTopic {
  questions: [string, string, string]
  answers: [string, string, string]
}

export type DialoguePack = [DialogueTopic, DialogueTopic, DialogueTopic]

// Two short prompts and a contextual challenge, followed by three learner models.
export function topic(
  q: string,
  followUp: string,
  challenge: string,
  basic: string,
  natural: string,
  advanced: string,
): DialogueTopic {
  return {
    questions: [q, followUp, challenge],
    answers: [basic, natural, advanced],
  }
}
