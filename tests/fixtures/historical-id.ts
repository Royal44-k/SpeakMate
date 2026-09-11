import golden from './learner-export-v1.json'

export function historicalIdBackup(id: string) {
  const fixture = structuredClone(golden)
  fixture.sessions[0].id = id
  fixture.turns[0].id = `${id}:turn:0`
  fixture.turns[0].sessionId = id
  fixture.favorites[0].turnId = `${id}:turn:0`
  return fixture
}
