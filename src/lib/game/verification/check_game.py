import asyncio,json,time
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('/tmp/browser/web-slinger'); OUT.mkdir(exist_ok=True)
PROGRESS={'level':1,'unlocked_level':6,'best_score':0,'total_score':0,'endless_best':0,'endless_unlocked':False,'display_name':'Preview test'}
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  context=await browser.new_context(viewport={'width':1280,'height':1800})
  page=await context.new_page(); errors=[]; writes=[]; blocked=[]; results=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  async def network(route):
   url=route.request.url
   if url.startswith('http://localhost:8080') or url.startswith('ws://localhost:8080'): return await route.continue_()
   if '/rest/v1/game_progress' in url:
    if route.request.method in ['POST','PATCH','PUT']: writes.append(route.request.post_data); PROGRESS.update(json.loads(route.request.post_data)); return await route.fulfill(status=201,body='[]',content_type='application/json')
    if 'order=' in url: return await route.fulfill(status=200,body='[]',content_type='application/json')
    return await route.fulfill(status=200,body=json.dumps(PROGRESS),content_type='application/json')
   if '/auth/v1/user' in url: return await route.fulfill(status=200,body='{"user":null}',content_type='application/json')
   blocked.append(url.split('?')[0]); await route.abort()
  await context.route('**/*',network)
  await page.goto('http://localhost:8080',wait_until='domcontentloaded')
  await page.get_by_role('button',name='').count()
  print('buttons',await page.get_by_role('button').all_text_contents())
  # The existing site button has a title, discovered from the actual DOM.
  await page.locator('button').filter(has_text='').count()
  opener=page.locator('button').filter(has=page.locator('svg')).all
  print('titles',await page.locator('button').evaluate_all('(els)=>els.map(e=>({text:e.innerText,title:e.title,label:e.getAttribute("aria-label")}))'))
  await page.wait_for_timeout(2500)
  if await page.get_by_role("button",name="VERSTANDEN",exact=True).count(): await page.get_by_role("button",name="VERSTANDEN",exact=True).click()
  await page.get_by_role('button',name='Mini-Spiel starten: KSE Web-Slinger').click(force=True)
  await page.wait_for_timeout(5000); await page.screenshot(path=str(OUT/"opening.png")); print("OPEN",await page.locator(".kse-game-modal").inner_text(), "ERRORS",errors)
  await page.get_by_role('heading',name='MISSIONS-AUSWAHL').wait_for()
  # Read live React state only to target the actual moving enemies; input remains real mouse events.
  await page.evaluate('''() => { window.readGame = () => {const el=document.querySelector('canvas[aria-label="Web-Slinger Spielfeld"]'); if(!el)return null; const key=Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f=el[key]; while(f){ if(f.type?.name==='SpideyGame'){let h=f.memoizedState; while(h){const v=h.memoizedState?.current; if(v?.villains&&v?.aim&&v?.level)return v; h=h.next;} } f=f.return;} return null;}; }''')
  for level in range(1,7):
   await page.get_by_role('button',name=f'Level {level}',exact=False).click()
   await page.get_by_role('button',name="LOS GEHT'S").click()
   await page.wait_for_timeout(2300)
   canvas=page.get_by_role('img',name='Web-Slinger Spielfeld') if False else page.locator('canvas[aria-label="Web-Slinger Spielfeld"]')
   await canvas.screenshot(path=str(OUT/f'level-{level}.png'))
   box=await canvas.bounding_box(); start=time.monotonic(); held=False
   while time.monotonic()-start<65:
    state=await page.evaluate('''()=> {const s=window.readGame();return s?{running:s.running,outcome:s.outcome,score:s.score,kills:s.kills,lives:s.lives,elapsed:s.elapsed,enemies:s.villains.filter(v=>!v.hit&&v.x>20).map(v=>({x:v.x,y:v.y,kind:v.kind,hp:v.hp})),open:s.bossOpen}:null;}''')
    if not state or not state['running']: break
    enemies=state['enemies']; enemies.sort(key=lambda v:v['x'],reverse=True)
    if level==6 and state['open']: enemies.sort(key=lambda v:0 if v['kind']=='boss' else 1)
    targets=[v for v in enemies if v['kind']!='boss' or state['open']]
    if targets:
     v=targets[0]; await page.mouse.move(box['x']+v['x']*box['width']/720,box['y']+v['y']*box['height']/480)
     if not held: await page.mouse.down();held=True
    elif held: await page.mouse.up();held=False
    await page.wait_for_timeout(45)
   await page.mouse.up()
   assert state and state['outcome']=='cleared', f'Mission {level} did not clear: {state}'
   await page.wait_for_timeout(250)
   await page.screenshot(path=str(OUT/f'level-{level}-result.png'))
   results.append({'level':level,'state':state})
   print('LEVEL',level,json.dumps(state))
   if level<6:
    await page.get_by_role('button',name='MISSIONEN',exact=True).click()
   else:
    await page.get_by_role('button',name='MISSIONEN',exact=True).click()
  # Read-back through UI after remount; only our intercepted memory store is touched.
  await page.get_by_role('button',name='Schließen',exact=True).click()
  await page.get_by_role('button',name='Mini-Spiel starten: KSE Web-Slinger').click(force=True)
  await page.get_by_role('heading',name='MISSIONS-AUSWAHL').wait_for()
  assert 'Gesamt' in await page.get_by_role('dialog',name='KSE Web-Slinger').inner_text()
  await page.screenshot(path=str(OUT/'save-readback.png'))
  await page.get_by_role('button',name='Endlos · sofort spielbar' ,exact=False).click()
  await page.get_by_role('button',name="LOS GEHT'S").click(); await page.wait_for_timeout(2000)
  await page.locator('canvas').screenshot(path=str(OUT/'endless.png'))
  # Measure actual Canvas draw time in headless Chromium (not a physical-device FPS claim).
  metrics=await page.evaluate("""async()=> { const {renderGame,createScene}=await import('/src/lib/game/scenery.ts'); const {createGame,spawnEnemy}=await import('/src/lib/game/engine.ts'); const {LEVELS}=await import('/src/lib/game/levels.ts'); const ctx=document.querySelector('canvas').getContext('2d'); const results=[]; for(const level of LEVELS){const start=performance.now();const cache=createScene(level.id);const cacheMs=performance.now()-start;const s=createGame(level);for(let i=0;i<16;i++){const e=spawnEnemy(s,i%3===0?'tank':'runner',i%3);e.x=40+i*30;} const timings=[];for(let i=0;i<120;i++){s.elapsed=i/60;const t=performance.now();renderGame(ctx,cache,s,false);timings.push(performance.now()-t);}timings.sort((a,b)=>a-b); results.push({level:level.id,cacheMs,drawMedianMs:timings[60],drawP95Ms:timings[114],enemies:16});} return results;}""")
  (OUT/'metrics.json').write_text(json.dumps(metrics,indent=2))
  await page.get_by_role('button',name='PAUSE',exact=True).click()
  await page.get_by_role('button',name='Schließen',exact=True).click()
  await context.close()
  # Mobile touch + reduced motion, same untouched backend interception.
  context=await browser.new_context(viewport={'width':1280,'height':1800},has_touch=True,is_mobile=True,reduced_motion='reduce')
  await context.route('**/*',network); page=await context.new_page(); page.on('pageerror',lambda e:errors.append(str(e)))
  await page.set_viewport_size({'width':390,'height':844}); await page.goto('http://localhost:8080',wait_until='domcontentloaded')
  await page.wait_for_timeout(2500)
  if await page.get_by_role("button",name="VERSTANDEN",exact=True).count(): await page.get_by_role("button",name="VERSTANDEN",exact=True).click()
  await page.get_by_role('button',name='Mini-Spiel starten: KSE Web-Slinger').click(force=True); await page.get_by_role('button',name='Level 1',exact=False).click()
  await page.get_by_role('button',name="LOS GEHT'S").click(); await page.wait_for_timeout(2000)
  canvas=page.locator('canvas[aria-label="Web-Slinger Spielfeld"]'); box=await canvas.bounding_box()
  await page.touchscreen.tap(box['x']+box['width']*.25,box['y']+box['height']*.31)
  await page.evaluate("""() => { window.readGame = () => {const el=document.querySelector('canvas'); const key=Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f=el[key]; while(f){ if(f.type?.name==='SpideyGame'){let h=f.memoizedState; while(h){const v=h.memoizedState?.current; if(v?.villains&&v?.aim&&v?.level)return v; h=h.next;} } f=f.return;} return null;}; }""")
  cdp=await context.new_cdp_session(page)
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':box['x']+100,'y':box['y']+100}]})
  assert await page.evaluate('window.readGame().firing')
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
  assert not await page.evaluate('window.readGame().firing')
  assert await page.evaluate('window.readGame().pointerId===null')
  await page.screenshot(path=str(OUT/'mobile-touch.png'))
  overflow=await page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
  await page.get_by_role('button',name='Schließen',exact=True).click()
  await page.wait_for_timeout(250)
  print('MOBILE_OVERFLOW',overflow,'ERRORS',errors,'MOCK_WRITES',len(writes))
  print('METRICS',json.dumps(metrics))
  (OUT/'results.json').write_text(json.dumps({'levels':results,'errors':errors,'mock_writes':len(writes),'mobile_overflow':overflow,'blocked_external_requests':len(blocked)},indent=2))
  await browser.close()
asyncio.run(main())
