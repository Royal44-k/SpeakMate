# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-legacy-micro.spec.ts >> F: imported v1 micro snapshot reopens offline with its original target rather than the current v2 replacement
- Location: tests\e2e\task7-legacy-micro.spec.ts:7:1

# Error details

```
TypeError: Cannot read properties of undefined (reading 'id')
```

# Test source

```ts
  1  | import {expect,test} from '@playwright/test'
  2  | import {readFile,readdir,writeFile} from 'node:fs/promises'
  3  | import {newSimulation} from '../../src/features/notebook/simulation-material'
  4  | import {publicCategorySchema} from '../../src/content/public-category-schema'
  5  | import {localState,protect,answer} from './task7-browser-helpers'
  6  | 
  7  | test('F: imported v1 micro snapshot reopens offline with its original target rather than the current v2 replacement',async({page,context,baseURL},info)=>{
  8  |   test.setTimeout(90000)
  9  |   const finishNetwork=await protect(context,baseURL!)
  10 |   // Named historical-version fixture only. Build with the original domain
  11 |   // projection, then exercise actual file restore and pinned browser resumption.
  12 |   const base=JSON.parse(await readFile('outputs/qa/task7/core-online-green/synthetic-completed-backup.json','utf8'))
  13 |   const folder=(await readdir('outputs/qa/task7/in2-fh')).find(name=>name.startsWith('task7-micro'))!
  14 |   const live=JSON.parse(await readFile(`outputs/qa/task7/in2-fh/${folder}/v2-five-real-simulations.json`,'utf8'))[0].session
  15 |   const data=publicCategorySchema.parse(await (await fetch(`${baseURL}/content/v1/dining`)).json())
  16 |   const sourcePack=data.packs.find(pack=>pack.sceneId==='dining-02'&&pack.level==='A1')!
  17 |   const descriptor={...live.simulation.descriptor,version:1}
  18 |   delete descriptor.targetQuestionOverride
  19 |   const source={...live.simulation.source.snapshot,id:'legacy-micro-source'}
> 20 |   const note={...base.notebook[0],id:'legacy-micro-note',profileId:base.profile[0].id,text:'on the side',normalizedText:'on the side',kind:'phrase',sources:[source],favoriteIds:[],notes:'Historical v1 pinned fixture',tags:[]}
     |                                                                                    ^ TypeError: Cannot read properties of undefined (reading 'id')
  21 |   const session=newSimulation(note,source,{sourcePack,descriptor,target:live.simulation.target,analysis:data.analyses.find(item=>item.id==='restaurant.phrase.on-the-side')!})
  22 |   session.simulation!.recall={text:'Historical saved recall.',completedAt:session.startedAt}
  23 |   session.simulation!.composition={text:'Historical saved composition.',completedAt:session.startedAt}
  24 |   const fixture={...base,sessions:[session],turns:[],favorites:[],notebook:[note],reviews:[],dailyPlans:[],learningEvents:[],pointsLedger:[],rewardUnlocks:[],outbox:[]}
  25 |   await page.goto('/privacy')
  26 |   await page.waitForFunction(()=>!!navigator.serviceWorker.controller,undefined,{timeout:30000})
  27 |   await page.locator('input[type=file]').setInputFiles({name:'historical-v1-micro.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))})
  28 |   await page.getByRole('button',{name:'确认合并恢复'}).click()
  29 |   await expect(page.getByText(/恢复完成/)).toBeVisible()
  30 |   expect((await localState(page)).sessions).toEqual([session])
  31 |   await context.setOffline(true)
  32 |   await page.goto(`/notebook/simulation?id=${session.id}`)
  33 |   await expect(page.getByRole('group',{name:'当前应答问题'})).toBeVisible()
  34 |   await answer(page)
  35 |   await answer(page)
  36 |   await expect(page.getByRole('group',{name:'当前应答问题'})).toContainText('Would you like chilli on your pasta?')
  37 |   await expect(page.getByRole('group',{name:'当前应答问题'})).not.toContainText('Chilli mixed into the pasta, or on the side?')
  38 |   await page.reload()
  39 |   const restored=(await localState(page)).sessions[0]
  40 |   expect(restored.simulation!.descriptor.version).toBe(1)
  41 |   expect(restored.gradedDialogue!.pack).toEqual(session.gradedDialogue!.pack)
  42 |   await answer(page)
  43 |   await page.getByRole('button',{name:'确认结束并保存复盘'}).click()
  44 |   await expect(page.getByRole('heading',{name:'这轮已保存。'})).toBeVisible()
  45 |   const completed=(await localState(page)).sessions[0]
  46 |   expect(completed.status).toBe('completed')
  47 |   expect(completed.gradedDialogue!.state.facts.find(fact=>fact.key==='chilli')?.value).toBe('no')
  48 |   await page.goto('/privacy')
  49 |   const download=page.waitForEvent('download')
  50 |   await page.getByRole('button',{name:'导出学习数据'}).click()
  51 |   await (await download).saveAs(info.outputPath('actual-v1-reexport.json'))
  52 |   await writeFile(info.outputPath('legacy-micro.json'),JSON.stringify({original:session,completed},null,2))
  53 |   await finishNetwork(info)
  54 | })
  55 | 
```