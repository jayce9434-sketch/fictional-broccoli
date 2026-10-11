(() => {
  const D=window.BUGBREAK_DATA;
  const SAVE_KEY='bugbreak-update1-save';
  const $=id=>document.getElementById(id);
  const now=()=>Date.now();
  const between=(a,b)=>now()>=Date.parse(a)&&now()<Date.parse(b);
  const seasonActive=id=>id==='halloween'?between(D.eventDates.halloweenStart,D.eventDates.halloweenEnd):id==='autumn'?between(D.eventDates.autumnStart,D.eventDates.autumnEnd):true;
  const defaultSave=()=>({
    version:12,gems:220,totalGems:220,candy:0,stormShards:0,bestWave:0,bestHard:0,bestStorm:0,wins:0,hardWins:0,halloweenWins:0,autumnWins:0,stormWins:0,
    selectedBug:'ant',selectedMode:'normal',playSide:'defender',unlocks:{halloweenWin:false,autumnWin:false,stormWin:false},
    enemyXP:0,enemyLevel:1,enemyOwned:{'garden-ant':true,'grave-ant':true,'hay-mite':true,'rain-ant':true},enemySelected:{normal:'garden-ant',hard:'garden-ant',halloween:'grave-ant',autumn:'hay-mite',storm:'rain-ant'},
    upgrades:Object.fromEntries(D.upgrades.map(u=>[u.id,0])),
    halloweenUpgrades:Object.fromEntries(D.halloweenUpgrades.map(u=>[u.id,0])),
    stormUpgrades:Object.fromEntries(D.stormUpgrades.map(u=>[u.id,0])),
    settings:{master:100,music:100,sfx:100,normalMusic:true,silentMode:false,musicEnabled:true,sfxEnabled:true,bossMusicEnabled:true,shake:true,perf:(('ontouchstart' in window)||navigator.maxTouchPoints>0)},ownerCustomBugs:[],dailyDay:'',dailyStreak:0,halloweenExpiredCleaned:false
  });
  function load(){
    try{
      const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
      const d=defaultSave();
      if(!raw)return d;
      if((raw.version||0)<9&&!localStorage.getItem('bugbreak-update1-save-backup-pre-1-2')){try{localStorage.setItem('bugbreak-update1-save-backup-pre-1-2',JSON.stringify(raw))}catch{}}
      const s={...d,...raw,unlocks:{...d.unlocks,...(raw.unlocks||{})},upgrades:{...d.upgrades,...(raw.upgrades||{})},halloweenUpgrades:{...d.halloweenUpgrades,...(raw.halloweenUpgrades||{})},stormUpgrades:{...d.stormUpgrades,...(raw.stormUpgrades||{})},settings:{...d.settings,...(raw.settings||{})},enemyOwned:{...d.enemyOwned,...(raw.enemyOwned||{})},enemySelected:{...d.enemySelected,...(raw.enemySelected||{})}};s.version=12;s.ownerCustomBugs=Array.isArray(raw.ownerCustomBugs)?raw.ownerCustomBugs.slice(0,30):[];
      if((('ontouchstart' in window)||navigator.maxTouchPoints>0)&&(raw.version||0)<8)s.settings.perf=true;
      if(!seasonActive('halloween')&&!s.halloweenExpiredCleaned){
        s.halloweenUpgrades=Object.fromEntries(D.halloweenUpgrades.map(u=>[u.id,0]));
        s.candy=0;s.halloweenExpiredCleaned=true;
      }
      return s;
    }catch{return defaultSave()}
  }
  let save=load();
  const persist=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch{}};
  persist();
  const screens=[...document.querySelectorAll('.screen')];
  let toastTimer=0;
  function show(id){screens.forEach(s=>s.classList.toggle('active',s.id===id));}
  function toast(msg,ms=2200){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),ms)}
  function halloweenActive(){return seasonActive('halloween')}

  function cleanupExpiredSeason(){
    if(!halloweenActive()&&!save.halloweenExpiredCleaned){
      save.halloweenUpgrades=Object.fromEntries(D.halloweenUpgrades.map(u=>[u.id,0]));
      save.candy=0;save.halloweenExpiredCleaned=true;persist();
    }
  }
  function autumnActive(){return seasonActive('autumn')}
  function modeAvailable(mode){return !mode.seasonal||seasonActive(mode.seasonal)}
  function bugUnlocked(p){if(p.eventUnlock==='halloweenWin')return !!save.unlocks.halloweenWin;if(p.eventUnlock==='autumnWin')return !!save.unlocks.autumnWin;if(p.eventUnlock==='stormWin')return !!save.unlocks.stormWin;return true}
  function bugMini(p){return `<div class="mini-bug ${p.id}" style="--bug:${p.color}"><i class="wing w1"></i><i class="wing w2"></i><i class="leg l1"></i><i class="leg l2"></i><i class="leg l3"></i><i class="body"></i><i class="head"></i></div>`}
  function customBugSpec(b){
    if(!b)return null;
    return {id:b.id,name:b.name||'Custom Bug',subtitle:'OWNER CUSTOM',ability:b.abilityName||'Custom Ability',desc:b.desc||'Owner-created custom insect.',color:b.primary||'#78c98b',ownerCustom:true,customAbility:b.ability||'nova',visual:{body:b.body||'oval',head:b.head||'round',wings:b.wings||'none',legs:Math.max(1,Math.min(6,+b.legs||3)),antennae:b.antennae||'short',primary:b.primary||'#78c98b',secondary:b.secondary||'#244c39',gradient:b.gradient!==false,alpha:Math.max(.2,Math.min(1,+b.alpha||1)),scale:Math.max(.65,Math.min(1.65,+b.scale||1))},stats:{hp:Math.max(25,Math.min(5000,+b.hp||220)),damage:Math.max(1,Math.min(500,+b.damage||34)),speed:Math.max(80,Math.min(600,+b.speed||245)),crit:Math.max(0,Math.min(1,(+b.crit||12)/100)),cooldown:Math.max(1,Math.min(30,+b.cooldown||8))}};
  }
  function getPlayerSpec(id){const normal=D.players.find(p=>p.id===id);if(normal)return normal;if(ownerUnlocked&&String(id||'').startsWith('ownerbug-'))return customBugSpec((save.ownerCustomBugs||[]).find(b=>b.id===id));return null}
  function renderBugs(){
    const box=$('bugSelect');box.innerHTML='';
    for(const p of D.players){
      const ok=bugUnlocked(p),on=save.selectedBug===p.id;
      const b=document.createElement('button');b.type='button';b.className=`bug-card ${on?'selected':''} ${ok?'':'locked'} ${p.best?'best':''} ${p.eventBug?'event-bug':''}`;
      const label=p.eventBug&&!ok?(p.eventUnlock==='autumnWin'?'BEAT HARVEST':p.eventUnlock==='stormWin'?'BEAT STORMFRONT':'BEAT HALLOWEEN'):p.newBug?'NEW':p.best?'APEX':'';
      b.innerHTML=`${label?`<span class="new-ribbon">${label}</span>`:''}${bugMini(p)}<b>${p.name}</b><small>${p.subtitle}</small>`;
      b.addEventListener('click',()=>{if(!ok)return toast(p.eventUnlock==='autumnWin'?'Beat Harvest Rush to unlock Harvest Cicada permanently.':p.eventUnlock==='stormWin'?'Beat Stormfront Wave 30 to unlock Stormglass Dragonfly permanently.':'Beat Halloween Haunt Wave 20 to unlock Ghost Moth permanently.');save.selectedBug=p.id;persist();renderBugs();window.AudioSys.ui()});
      box.appendChild(b);
    }
    let p=getPlayerSpec(save.selectedBug);if(!p||(p.eventUnlock&&!bugUnlocked(p))){p=D.players[0];save.selectedBug=p.id;persist()}
    $('bugDetail').innerHTML=`<div class="desc"><b>${p.name} · ${p.ability}</b><p>${p.desc}</p></div><div class="stat-pill"><small>HP</small><strong>${p.stats.hp}</strong></div><div class="stat-pill"><small>DAMAGE</small><strong>${p.stats.damage}</strong></div><div class="stat-pill"><small>SPEED</small><strong>${p.stats.speed}</strong></div><div class="stat-pill"><small>CRIT</small><strong>${Math.round(p.stats.crit*100)}%</strong></div>`;
    $('rosterCount').textContent=`${D.players.filter(bugUnlocked).length}/${D.players.length}`;
  }
  function enemyModeKey(mode=save.selectedMode){return mode==='hard'?'normal':mode}
  function enemyCatalog(mode=save.selectedMode){return D.enemyCatalog[enemyModeKey(mode)]||D.enemyCatalog.normal}
  function enemySpec(id){return [...D.enemies,...D.halloweenEnemies,...D.autumnEnemies,...D.stormEnemies,...D.miniBosses,...D.bosses,...D.halloweenBosses,...D.autumnBosses,...D.stormBosses].find(x=>x.id===id)}
  function enemyXpNeed(level=save.enemyLevel){return 80+Math.max(0,level-1)*35}
  function addEnemyXp(n,quiet=false){n=Math.max(0,Math.round(n));save.enemyXP=(save.enemyXP||0)+n;let ups=0;while(save.enemyXP>=enemyXpNeed(save.enemyLevel)){save.enemyXP-=enemyXpNeed(save.enemyLevel);save.enemyLevel++;ups++}persist();if(ups)toast(`ENEMY LEVEL ${save.enemyLevel} unlocked.`);if(!quiet)syncMenu();return ups}
  function selectedEnemyEntry(mode=save.selectedMode){const cat=enemyCatalog(mode),key=enemyModeKey(mode),id=save.enemySelected[mode]||save.enemySelected[key]||cat[0]?.id;return cat.find(x=>x.id===id)||cat[0]}
  function enemyOwned(entry){return entry?.cost===0||!!save.enemyOwned[entry?.id]}
  function renderEnemyLoadout(){
    const box=$('enemySelect');if(!box)return;box.innerHTML='';const cat=enemyCatalog();const hard=save.selectedMode==='hard';let selected=selectedEnemyEntry();if(!enemyOwned(selected)){selected=cat.find(enemyOwned)||cat[0];save.enemySelected[save.selectedMode]=selected.id;persist()}
    for(const entry of cat){const spec=enemySpec(entry.id);if(!spec)continue;const owned=enemyOwned(entry),on=selected.id===entry.id;const b=document.createElement('button');b.type='button';b.className=`enemy-card ${on?'selected':''} ${owned?'':'locked'} ${hard?'hard':''} ${(save.selectedMode==='halloween'||save.selectedMode==='autumn'||save.selectedMode==='storm')?'event':''}`;b.style.setProperty('--enemy',spec.color);b.innerHTML=`<span class="enemy-sigil"></span><b>${hard&&!entry.finalBoss?'RELIC '+spec.name.toUpperCase():spec.name}</b><small>${owned?'PERMANENTLY OWNED':entry.cost+' GEMS'} · Lv ${entry.level}</small><span class="${owned?'owned':'gate'}">${owned?'OWNED':'BUY'}</span><span class="gate">W${entry.wave}</span>`;b.addEventListener('click',()=>{if(!owned){renderEnemyShop();show('enemyShop');window.AudioSys.ui();return}if(save.enemyLevel<entry.level)return toast(`Enemy Level ${entry.level} required.`);save.enemySelected[save.selectedMode]=entry.id;persist();renderEnemyLoadout();window.AudioSys.ui()});box.appendChild(b)}
    const spec=enemySpec(selected.id);$('enemyLevelText').textContent=save.enemyLevel;$('enemyXpText').textContent=`${save.enemyXP} / ${enemyXpNeed()}`;$('enemyOwnedText').textContent=Object.values(save.enemyOwned||{}).filter(Boolean).length;$('enemyMetaLevel').textContent=save.enemyLevel;
    if(spec)$('enemyDetail').innerHTML=`<div class="desc"><b>${hard&&!selected.finalBoss?'RELIC '+spec.name.toUpperCase():spec.name}</b><p>${selected.finalBoss?'FINAL BOSS CLASS · ':selected.bossClass?'BOSS CLASS · ':''}Permanent ownership does not bypass progression. Requires Enemy Level ${selected.level} and Wave ${selected.wave} in ${save.selectedMode.toUpperCase()}.</p></div><div class="stat-pill"><small>HP</small><strong>${Math.round(spec.hp)}</strong></div><div class="stat-pill"><small>DAMAGE</small><strong>${Math.round(spec.damage)}</strong></div><div class="stat-pill"><small>SPEED</small><strong>${Math.round(spec.speed)}</strong></div>`
  }
  function renderEnemyShop(){const g=$('enemyShopGrid');if(!g)return;$('enemyShopGems').textContent=save.gems;$('enemyShopLevel').textContent=save.enemyLevel;$('enemyShopMode').textContent=save.selectedMode.toUpperCase();g.innerHTML='';for(const entry of enemyCatalog()){const spec=enemySpec(entry.id);if(!spec)continue;const owned=enemyOwned(entry),canLevel=save.enemyLevel>=entry.level,canBuy=owned||(canLevel&&save.gems>=entry.cost);const card=document.createElement('div');card.className=`enemy-shop-card ${owned?'owned':''} ${entry.finalBoss?'final':''} ${(save.selectedMode==='halloween'||save.selectedMode==='autumn'||save.selectedMode==='storm')?'event':''}`;card.innerHTML=`<h4>${spec.name}</h4><p>${entry.finalBoss?'Final boss class. Only usable on the final wave.':entry.bossClass?'Boss-class enemy with a strict late-wave gate.':'Permanent Enemy Mode class.'}</p><div class="reqs"><span>LV ${entry.level}</span><span>WAVE ${entry.wave}+</span><span>${entry.cost?entry.cost+' GEMS':'FREE'}</span></div><button ${owned||!canBuy?'disabled':''}>${owned?'OWNED':!canLevel?`LV ${entry.level} REQUIRED`:`BUY · ${entry.cost} GEMS`}</button>`;card.querySelector('button').addEventListener('click',()=>{if(owned||!canBuy)return;save.gems-=entry.cost;save.enemyOwned[entry.id]=true;persist();renderEnemyShop();renderEnemyLoadout();syncMenu();window.AudioSys.sfx('gem',.45);toast(`${spec.name} permanently unlocked.`)});g.appendChild(card)}}
  function syncSide(){const enemy=save.playSide==='enemy';$('defenderSideBtn')?.classList.toggle('selected',!enemy);$('enemySideBtn')?.classList.toggle('selected',enemy);$('defenderLoadout')?.classList.toggle('hidden',enemy);$('enemyLoadout')?.classList.toggle('hidden',!enemy);$('shopBtn')?.classList.toggle('hidden',enemy);$('enemyShopBtn')?.classList.toggle('hidden',!enemy);$('mobileEnemyStart')?.classList.toggle('hidden',!enemy);$('menu')?.classList.toggle('enemy-active',enemy);if(enemy)renderEnemyLoadout();syncModeHero()}
  function renderModes(){
    const box=$('modeSelect');box.innerHTML='';
    for(const m of D.modes){
      const ok=modeAvailable(m),on=save.selectedMode===m.id;
      const b=document.createElement('button');b.type='button';b.className=`mode-card mode-${m.id} ${on?'selected':''} ${ok?'':'locked'}`;
      let meta=m.kicker;if(m.id==='halloween')meta=ok?'HALLOWEEN LIVE · 20 WAVES':'EVENT ENDED';if(m.id==='autumn')meta=ok?'AUTUMN LIVE · 25 WAVES':'EVENT ENDED';if(m.id==='storm')meta='UPDATE 2 · 30 WAVES';
      b.innerHTML=`<span class="mode-badge">${m.badge}</span><small>${meta}</small><b>${m.name}</b><p>${m.desc}</p>`;
      b.addEventListener('click',()=>{if(!ok)return toast(`${m.name} is not currently active.`);save.selectedMode=m.id;persist();renderModes();syncModeHero();if(save.playSide==='enemy')renderEnemyLoadout();window.AudioSys.ui()});box.appendChild(b);
    }
    if(!modeAvailable(D.modes.find(m=>m.id===save.selectedMode))){save.selectedMode='normal';persist();renderModes()}
  }
  function syncModeHero(){
    const m=D.modes.find(x=>x.id===save.selectedMode)||D.modes[0],enemy=save.playSide==='enemy';const startLabel=enemy?(m.id==='normal'?'INVADE COLONY':m.id==='hard'?'ENTER RELIC NIGHTFALL':m.id==='halloween'?'HAUNT THE COLONY':m.id==='autumn'?'RAID THE HARVEST':'ENTER THE STORM'):(m.id==='normal'?'START EXPEDITION':m.id==='hard'?'ENTER NIGHTFALL':m.id==='halloween'?'ENTER THE HAUNT':m.id==='autumn'?'START HARVEST RUSH':'ENTER STORMFRONT');$('playBtn').textContent=startLabel;if($('mobileEnemyStart'))$('mobileEnemyStart').textContent=startLabel;
    $('modeSummary').textContent=enemy?`Enemy Mode · ${m.desc} Smart colony bots defend the nest while your permanent enemy roster obeys XP and wave gates.`:m.desc;$('modeWave').textContent=`${m.waves} WAVES`;
  }
  function upCost(u,rank){return Math.round(u.base*(1+rank*.53+rank*rank*.035))}
  function candyCost(u,rank){return Math.round(u.base*(1+rank*.7))}
  function renderShop(){
    cleanupExpiredSeason();
    $('shopGems').textContent=save.gems;$('shopCandy').textContent=save.candy;if($('shopStormShards'))$('shopStormShards').textContent=save.stormShards||0;
    const g=$('upgradeGrid');g.innerHTML='';
    for(const u of D.upgrades){const r=save.upgrades[u.id]||0,c=upCost(u,r),max=r>=u.max;const card=document.createElement('div');card.className=`upgrade ${u.newUpgrade?'new-upgrade':''}`;card.innerHTML=`<div class="up-top"><span class="up-icon">${u.icon}</span><span class="rank">LV ${r}/${u.max}</span></div><h4>${u.name}${u.newUpgrade?' · NEW':''}</h4><p>${u.desc}</p><button ${max||save.gems<c?'disabled':''}>${max?'MAXED':`${c} GEMS`}</button>`;card.querySelector('button').addEventListener('click',()=>{if(max||save.gems<c)return;save.gems-=c;save.upgrades[u.id]=r+1;persist();renderShop();syncMenu();window.AudioSys.sfx('gem',.35)});g.appendChild(card)}
    const seasonal=$('seasonalShop');const sg=$('halloweenUpgradeGrid');
    seasonal.classList.toggle('hidden',!halloweenActive());sg.innerHTML='';
    if(halloweenActive())for(const u of D.halloweenUpgrades){const r=save.halloweenUpgrades[u.id]||0,c=candyCost(u,r),max=r>=u.max;const card=document.createElement('div');card.className='upgrade seasonal-upgrade';card.innerHTML=`<div class="up-top"><span class="up-icon">${u.icon}</span><span class="rank">LV ${r}/${u.max}</span></div><h4>${u.name}</h4><p>${u.desc}</p><button ${max||save.candy<c?'disabled':''}>${max?'MAXED':`${c} CANDY`}</button>`;card.querySelector('button').addEventListener('click',()=>{if(max||save.candy<c)return;save.candy-=c;save.halloweenUpgrades[u.id]=r+1;persist();renderShop();syncMenu();window.AudioSys.sfx('candy',.6)});sg.appendChild(card)}

    const stg=$('stormUpgradeGrid');if(stg){stg.innerHTML='';for(const u of D.stormUpgrades){const r=save.stormUpgrades[u.id]||0,c=Math.round(u.base*(1+r*.65)),max=r>=u.max;const card=document.createElement('div');card.className='upgrade storm-upgrade';card.innerHTML=`<div class="up-top"><span class="up-icon">${u.icon}</span><span class="rank">LV ${r}/${u.max}</span></div><h4>${u.name} · UPDATE 2</h4><p>${u.desc}</p><button ${max||save.stormShards<c?'disabled':''}>${max?'MAXED':`${c} SHARDS`}</button>`;card.querySelector('button').addEventListener('click',()=>{if(max||save.stormShards<c)return;save.stormShards-=c;save.stormUpgrades[u.id]=r+1;persist();renderShop();syncMenu();window.AudioSys.sfx('gem',.4)});stg.appendChild(card)}}
  }
  function syncMenu(){
    cleanupExpiredSeason();
    $('bestWave').textContent=save.bestWave;$('bestHard').textContent=save.bestHard;$('menuGems').textContent=save.gems;$('menuCandy').textContent=save.candy;if($('menuStormShards'))$('menuStormShards').textContent=save.stormShards||0;if($('bestStorm'))$('bestStorm').textContent=save.bestStorm||0;$('candyMeta').classList.toggle('hidden',!halloweenActive());renderBugs();renderModes();renderDaily();syncModeHero();
    $('halloweenLivePill').classList.toggle('hidden',!halloweenActive());$('autumnLivePill').classList.toggle('hidden',!autumnActive());$('enemyMetaLevel').textContent=save.enemyLevel;syncSide();
  }
  function dayKey(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
  function renderDaily(){const today=dayKey(),claimed=save.dailyDay===today,box=$('dailyCard');box.innerHTML=`<span><b>DAILY FORAGE</b> · ${claimed?'collected today':'+35 gems and +1 streak'}</span><button ${claimed?'disabled':''}>${claimed?'CLAIMED':'CLAIM'}</button>`;box.querySelector('button').addEventListener('click',()=>{if(claimed)return;save.dailyDay=today;save.dailyStreak=(save.dailyStreak||0)+1;save.gems+=35;save.totalGems+=35;persist();syncMenu();window.AudioSys.sfx('gem');toast('Daily forage: +35 gems')})}
  function settingsUI(){
    const s=save.settings;
    if(s.silentMode==null)s.silentMode=false;if(s.musicEnabled==null)s.musicEnabled=true;if(s.sfxEnabled==null)s.sfxEnabled=true;if(s.bossMusicEnabled==null)s.bossMusicEnabled=true;
    for(const [id,out,key] of [['masterVol','masterOut','master'],['musicVol','musicOut','music'],['sfxVol','sfxOut','sfx']]){const el=$(id);el.value=s[key];$(out).textContent=s[key]+'%';el.oninput=()=>{$(out).textContent=el.value+'%';s[key]=+el.value;window.AudioSys.update(s);persist()}}
    const silent=$('silentModeToggle'),musicOn=$('musicEnabledToggle'),bossOn=$('bossMusicToggle'),sfxOn=$('sfxEnabledToggle');
    if(silent)silent.checked=!!s.silentMode;if(musicOn)musicOn.checked=!!s.musicEnabled;if(bossOn)bossOn.checked=!!s.bossMusicEnabled;if(sfxOn)sfxOn.checked=!!s.sfxEnabled;
    $('normalMusicToggle').checked=s.normalMusic;$('shakeToggle').checked=s.shake;$('perfToggle').checked=s.perf;
    const syncAudioLocks=()=>{const locked=!!s.silentMode;for(const id of ['masterVol','musicVol','sfxVol','musicEnabledToggle','bossMusicToggle','sfxEnabledToggle','normalMusicToggle']){const el=$(id);if(el)el.disabled=locked}const note=$('silentStatus');if(note)note.textContent=locked?'YOUTUBE MODE ACTIVE · BugBreak will not call audio playback.':'Game audio is allowed.'};
    if(silent)silent.onchange=e=>{s.silentMode=e.target.checked;window.AudioSys.update(s);persist();syncAudioLocks();toast(s.silentMode?'YouTube Mode ON · all BugBreak audio disabled.':'YouTube Mode OFF · audio restored.')};
    if(musicOn)musicOn.onchange=e=>{s.musicEnabled=e.target.checked;window.AudioSys.update(s);persist()};if(bossOn)bossOn.onchange=e=>{s.bossMusicEnabled=e.target.checked;window.AudioSys.update(s);persist()};if(sfxOn)sfxOn.onchange=e=>{s.sfxEnabled=e.target.checked;window.AudioSys.update(s);persist()};
    $('normalMusicToggle').onchange=e=>{s.normalMusic=e.target.checked;window.AudioSys.update(s);persist()};$('shakeToggle').onchange=e=>{s.shake=e.target.checked;persist()};$('perfToggle').onchange=e=>{s.perf=e.target.checked;persist()};window.AudioSys.update(s);syncAudioLocks();
  }
  function addGems(n){n=Math.max(0,Math.round(n));save.gems+=n;save.totalGems+=n;persist();syncMenu()}
  function addCandy(n){if(!halloweenActive())return;save.candy+=Math.max(0,Math.round(n));persist();syncMenu()}
  function addStormShards(n){save.stormShards=(save.stormShards||0)+Math.max(0,Math.round(n));persist();syncMenu()}
  function recordWave(w,mode){if(mode==='normal'&&w>save.bestWave)save.bestWave=w;if(mode==='hard'&&w>save.bestHard)save.bestHard=w;if(mode==='storm'&&w>(save.bestStorm||0))save.bestStorm=w;persist();syncMenu()}
  function win(mode){
    if(mode==='normal'){save.wins++;save.bestWave=50}
    if(mode==='hard'){save.hardWins++;save.bestHard=50}
    if(mode==='halloween'){save.halloweenWins++;save.unlocks.halloweenWin=true}
    if(mode==='autumn'){save.autumnWins++;save.unlocks.autumnWin=true}
    if(mode==='storm'){save.stormWins=(save.stormWins||0)+1;save.bestStorm=30;save.unlocks.stormWin=true}
    persist();syncMenu();
  }
  function reset(){save=defaultSave();persist();settingsUI();syncMenu();toast('Save reset. Starter gems restored.')}


  // UPDATE 1.2.7 · OWNER TOOLS + CREATE BUG
  const OWNER_HASH='be17f127652f79a3a5785ab8e14c10d75d665cfc9669205353d0d067c952fb28';
  let ownerUnlocked=false;
  let editingCustomBugId=null;
  function allOwnerEnemyEntries(){
    const seen=new Set(),out=[];
    for(const mode of ['normal','halloween','autumn','storm'])for(const e of (D.enemyCatalog[mode]||[])){if(seen.has(e.id))continue;seen.add(e.id);out.push({...e,ownerSourceMode:mode})}
    return out;
  }
  function renderOwnerEnemyOverride(){const sel=$('ownerEnemyOverrideSelect');if(!sel||!ownerUnlocked)return;const keep=sel.value;sel.innerHTML='';for(const e of allOwnerEnemyEntries()){const sp=enemySpec(e.id);if(!sp)continue;const o=document.createElement('option');o.value=e.id;o.textContent=`${sp.name} · ${e.ownerSourceMode.toUpperCase()} · normal gate W${e.wave}`;sel.appendChild(o)}if([...sel.options].some(o=>o.value===keep))sel.value=keep}
  const field=id=>$(id);
  function currentBugDraft(){return {name:(field('customBugName')?.value||'Custom Bug').trim().slice(0,24)||'Custom Bug',body:field('customBugBody')?.value||'oval',head:field('customBugHead')?.value||'round',wings:field('customBugWings')?.value||'none',legs:Math.max(1,Math.min(6,Math.round(+field('customBugLegs')?.value||3))),antennae:field('customBugAntennae')?.value||'short',primary:field('customBugPrimary')?.value||'#78c98b',secondary:field('customBugSecondary')?.value||'#244c39',gradient:!!field('customBugGradient')?.checked,alpha:Math.max(.2,Math.min(1,(+field('customBugAlpha')?.value||100)/100)),scale:Math.max(.65,Math.min(1.65,(+field('customBugScale')?.value||100)/100)),hp:Math.max(25,Math.min(5000,Math.round(+field('customBugHp')?.value||220))),damage:Math.max(1,Math.min(500,Math.round(+field('customBugDamage')?.value||34))),speed:Math.max(80,Math.min(600,Math.round(+field('customBugSpeed')?.value||245))),crit:Math.max(0,Math.min(100,Math.round(+field('customBugCrit')?.value||12))),cooldown:Math.max(1,Math.min(30,+field('customBugCooldown')?.value||8)),ability:field('customBugAbility')?.value||'nova',abilityName:(field('customBugAbilityName')?.value||'Relic Burst').trim().slice(0,28)||'Relic Burst',desc:(field('customBugDesc')?.value||'Owner-created custom insect.').trim().slice(0,90)} }
  function setBugDraft(b){const d=b||{name:'Relic Maker',body:'oval',head:'round',wings:'none',legs:3,antennae:'short',primary:'#78c98b',secondary:'#244c39',gradient:true,alpha:1,scale:1,hp:220,damage:34,speed:245,crit:12,cooldown:8,ability:'nova',abilityName:'Relic Burst',desc:'Owner-created custom insect.'};const vals={customBugName:d.name,customBugBody:d.body,customBugHead:d.head,customBugWings:d.wings,customBugLegs:d.legs,customBugAntennae:d.antennae,customBugPrimary:d.primary,customBugSecondary:d.secondary,customBugAlpha:Math.round((d.alpha??1)*100),customBugScale:Math.round((d.scale??1)*100),customBugHp:d.hp,customBugDamage:d.damage,customBugSpeed:d.speed,customBugCrit:d.crit,customBugCooldown:d.cooldown,customBugAbility:d.ability,customBugAbilityName:d.abilityName,customBugDesc:d.desc};for(const [id,v] of Object.entries(vals))if(field(id))field(id).value=v??'';if(field('customBugGradient'))field('customBugGradient').checked=d.gradient!==false;editingCustomBugId=b?.id||null;drawCustomBugPreview()}
  function drawBugShape(c,b,x,y,scale=1){const ctx=c,alpha=Math.max(.2,Math.min(1,b.alpha??1)),s=scale*(b.scale||1);ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.globalAlpha=alpha;const pri=b.primary||'#78c98b',sec=b.secondary||'#244c39',fill=b.gradient!==false?(()=>{const g=ctx.createLinearGradient(-65,-35,70,40);g.addColorStop(0,pri);g.addColorStop(1,sec);return g})():pri;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=sec;ctx.lineWidth=6;const legs=Math.max(1,Math.min(6,+b.legs||3));for(const sy of [-1,1])for(let i=0;i<legs;i++){const px=-36+(i/(Math.max(1,legs-1)))*72;ctx.beginPath();ctx.moveTo(px,sy*13);ctx.lineTo(px+(i-legs/2)*5,sy*(35+i*3));ctx.lineTo(px+(i-legs/2)*9,sy*(50+i*3));ctx.stroke()}
    const wing=(len,wid,off=0)=>{for(const sy of [-1,1]){ctx.fillStyle='rgba(215,240,238,.38)';ctx.strokeStyle='rgba(220,245,244,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(-5+off,sy*26,len,wid,sy*.12,0,Math.PI*2);ctx.fill();ctx.stroke()}};if(b.wings==='short')wing(29,12);if(b.wings==='long')wing(50,12);if(b.wings==='moth')wing(43,22);if(b.wings==='double'){wing(44,11,-8);wing(31,9,12)}
    ctx.fillStyle=fill;ctx.strokeStyle=sec;ctx.lineWidth=5;if(b.body==='round'){ctx.beginPath();ctx.arc(-10,0,42,0,Math.PI*2)}else if(b.body==='long'){ctx.beginPath();ctx.ellipse(-12,0,67,24,0,0,Math.PI*2)}else if(b.body==='angular'){ctx.beginPath();ctx.moveTo(-72,0);ctx.lineTo(-40,-30);ctx.lineTo(25,-24);ctx.lineTo(58,0);ctx.lineTo(25,24);ctx.lineTo(-40,30);ctx.closePath()}else if(b.body==='segmented'){for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(-48+i*24,0,18,20,0,0,Math.PI*2);ctx.fill();ctx.stroke()}ctx.beginPath();ctx.ellipse(-48,0,18,20,0,0,Math.PI*2)}else{ctx.beginPath();ctx.ellipse(-15,0,58,30,0,0,Math.PI*2)}ctx.fill();ctx.stroke();
    const hs=b.head==='small'?20:b.head==='large'?38:29;ctx.fillStyle=b.gradient!==false?sec:pri;ctx.strokeStyle=sec;ctx.lineWidth=5;if(b.head==='angular'){ctx.beginPath();ctx.moveTo(38,-24);ctx.lineTo(70,-15);ctx.lineTo(80,0);ctx.lineTo(70,15);ctx.lineTo(38,24);ctx.closePath()}else{ctx.beginPath();ctx.ellipse(53,0,b.head==='oval'?hs+8:hs,hs,0,0,Math.PI*2)}ctx.fill();ctx.stroke();ctx.fillStyle='#101612';for(const sy of [-1,1]){ctx.beginPath();ctx.arc(62,sy*8,4,0,Math.PI*2);ctx.fill()}
    if(b.antennae!=='none'){const len=b.antennae==='long'?45:26;ctx.strokeStyle=sec;ctx.lineWidth=3;for(const sy of [-1,1]){ctx.beginPath();ctx.moveTo(70,sy*12);ctx.quadraticCurveTo(88,sy*(16+len*.3),98+len*.45,sy*len);ctx.stroke();if(b.antennae==='clubbed'){ctx.fillStyle=sec;ctx.beginPath();ctx.arc(98+len*.45,sy*len,5,0,Math.PI*2);ctx.fill()}}}ctx.restore()}
  function drawCustomBugPreview(){const canvas=field('ownerBugPreview');if(!canvas||!ownerUnlocked)return;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);const bg=ctx.createRadialGradient(260,135,20,260,150,310);bg.addColorStop(0,'#20382b');bg.addColorStop(1,'#050a08');ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);const d=currentBugDraft();drawBugShape(ctx,d,255,145,1.25);ctx.globalAlpha=1;ctx.fillStyle='#e8f3e8';ctx.font='800 20px system-ui';ctx.fillText(d.name,18,28);ctx.font='600 12px system-ui';ctx.fillStyle='#aebdaf';ctx.fillText(`${d.hp} HP · ${d.damage} DMG · ${d.speed} SPD · ${d.crit}% CRIT · ${d.abilityName}`,18,50);if(field('customBugAlphaOut'))field('customBugAlphaOut').textContent=Math.round(d.alpha*100)+'%';if(field('customBugScaleOut'))field('customBugScaleOut').textContent=Math.round(d.scale*100)+'%'}
  function renderCustomBugList(){if(!ownerUnlocked)return;const list=field('customBugSavedList'),bugs=save.ownerCustomBugs||[];if(field('ownerBugSlotText'))field('ownerBugSlotText').textContent=`${bugs.length} / 30 BUG SAVES`;if(!list)return;list.innerHTML='';if(!bugs.length){list.innerHTML='<div class="owner-help">No custom bugs saved yet.</div>';return}for(const b of bugs){const row=document.createElement('div');row.className='custom-bug-row';row.innerHTML=`<div><b>${String(b.name||'Custom Bug').replace(/[<>]/g,'')}</b><small>${b.hp} HP · ${b.damage} DMG · ${b.abilityName||b.ability}</small></div><div class="custom-bug-actions"><button data-edit>EDIT</button><button data-equip class="primary">EQUIP</button><button data-delete>DELETE</button></div>`;row.querySelector('[data-edit]').onclick=()=>{setBugDraft(b);drawCustomBugPreview()};row.querySelector('[data-equip]').onclick=()=>{save.selectedBug=b.id;persist();renderBugs();toast(`${b.name} equipped. Admin-only custom bug.`)};row.querySelector('[data-delete]').onclick=()=>{if(save.selectedBug===b.id)save.selectedBug='ant';save.ownerCustomBugs=bugs.filter(x=>x.id!==b.id);persist();if(editingCustomBugId===b.id)setBugDraft(null);renderCustomBugList();renderBugs();toast('Custom bug deleted.')};list.appendChild(row)}}
  function saveCustomBug(){if(!ownerUnlocked)return toast('Owner menu locked.');const bugs=save.ownerCustomBugs||(save.ownerCustomBugs=[]),draft=currentBugDraft();if(editingCustomBugId){const i=bugs.findIndex(b=>b.id===editingCustomBugId);if(i>=0)bugs[i]={...draft,id:editingCustomBugId};else editingCustomBugId=null}if(!editingCustomBugId){if(bugs.length>=30)return toast('30 custom bug saves max. Delete one first.');const id='ownerbug-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);bugs.push({...draft,id});editingCustomBugId=id}persist();renderCustomBugList();drawCustomBugPreview();toast('Custom bug saved.')}
  async function ownerHash(text){
    try{const data=new TextEncoder().encode(String(text||'').trim().toUpperCase());const dig=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(dig)].map(b=>b.toString(16).padStart(2,'0')).join('')}catch{return ''}
  }
  function clampOwner(id,min,max,def=0){const el=$(id);let n=Number(el?.value);if(!Number.isFinite(n))n=def;n=Math.round(n);n=Math.max(min,Math.min(max,n));if(el)el.value=n;return n}
  function ownerSync(){persist();syncMenu();renderBugs();renderEnemyLoadout();renderEnemyShop();renderShop();renderOwnerEnemyOverride();if(ownerUnlocked)renderCustomBugList();const sum=$('ownerSummary');if(sum)sum.innerHTML=`Gems <b>${save.gems}</b> · Candy <b>${save.candy}</b> · Shards <b>${save.stormShards||0}</b><br>Enemy Lv <b>${save.enemyLevel}</b> · XP <b>${save.enemyXP}</b><br>Owned enemies <b>${Object.values(save.enemyOwned||{}).filter(Boolean).length}</b>`;const round=$('ownerRoundSummary');if(round){const es=window.ENEMY_MODE?.isRunning?.(),gs=window.BUGBREAK_GAME?.isRunning?.();if(es){const st=window.ENEMY_MODE?.getOwnerState?.();round.innerHTML=st?`Enemy Mode · <b>${String(st.mode).toUpperCase()}</b> · Wave <b>${st.wave}/${st.maxWave}</b>`:'Enemy Mode active.'}else if(gs){const st=window.BUGBREAK_GAME?.getOwnerState?.();round.innerHTML=st?`Defender Mode · <b>${String(st.mode).toUpperCase()}</b> · Wave <b>${st.wave}/${st.maxWave}</b>`:'Defender round active.'}else round.textContent='Start a round to use this.'}}
  function unlockAllEnemies(){for(const mode of ['normal','halloween','autumn','storm'])for(const e of (D.enemyCatalog[mode]||[]))save.enemyOwned[e.id]=true}
  function ownerAction(action){
    if(!ownerUnlocked)return toast('Owner menu locked.');
    if(action==='add-gems'){const n=clampOwner('ownerGemsAmount',0,999999999,0);save.gems+=n;save.totalGems+=n}
    else if(action==='set-gems'){const n=clampOwner('ownerGemsAmount',0,999999999,0);save.gems=n;save.totalGems=Math.max(save.totalGems||0,n)}
    else if(action==='add-candy'){save.candy+=clampOwner('ownerCandyAmount',0,999999999,0)}
    else if(action==='set-candy'){save.candy=clampOwner('ownerCandyAmount',0,999999999,0)}
    else if(action==='add-storm'){save.stormShards=(save.stormShards||0)+clampOwner('ownerStormAmount',0,999999999,0)}
    else if(action==='set-storm'){save.stormShards=clampOwner('ownerStormAmount',0,999999999,0)}
    else if(action==='set-enemy-level'){save.enemyLevel=clampOwner('ownerEnemyLevelAmount',1,9999,1);save.enemyXP=Math.min(save.enemyXP||0,Math.max(0,enemyXpNeed(save.enemyLevel)-1))}
    else if(action==='add-enemy-xp'){save.enemyXP=(save.enemyXP||0)+clampOwner('ownerEnemyXpAmount',0,999999999,0);while(save.enemyXP>=enemyXpNeed(save.enemyLevel)){save.enemyXP-=enemyXpNeed(save.enemyLevel);save.enemyLevel++}}
    else if(action==='set-enemy-xp'){save.enemyXP=clampOwner('ownerEnemyXpAmount',0,999999999,0);while(save.enemyXP>=enemyXpNeed(save.enemyLevel)){save.enemyXP-=enemyXpNeed(save.enemyLevel);save.enemyLevel++}}
    else if(action==='unlock-all-enemies'){unlockAllEnemies()}
    else if(action==='unlock-insect'){const id=$('ownerInsectSelect')?.value;if(id==='ghost-moth')save.unlocks.halloweenWin=true;if(id==='harvest-cicada')save.unlocks.autumnWin=true;if(id==='stormglass-dragonfly')save.unlocks.stormWin=true}
    else if(action==='unlock-all-insects'){save.unlocks.halloweenWin=true;save.unlocks.autumnWin=true;save.unlocks.stormWin=true}
    else if(action==='max-upgrades'){for(const u of D.upgrades)save.upgrades[u.id]=u.max}
    else if(action==='max-halloween'){for(const u of D.halloweenUpgrades)save.halloweenUpgrades[u.id]=u.max}
    else if(action==='max-storm'){for(const u of D.stormUpgrades)save.stormUpgrades[u.id]=u.max}
    else if(action==='zero-upgrades'){for(const u of D.upgrades)save.upgrades[u.id]=0}
    else if(action==='clear-normal'){save.wins=Math.max(1,save.wins||0);save.bestWave=50}
    else if(action==='clear-hard'){save.hardWins=Math.max(1,save.hardWins||0);save.bestHard=50}
    else if(action==='clear-halloween'){save.halloweenWins=Math.max(1,save.halloweenWins||0);save.unlocks.halloweenWin=true}
    else if(action==='clear-autumn'){save.autumnWins=Math.max(1,save.autumnWins||0);save.unlocks.autumnWin=true}
    else if(action==='clear-storm'){save.stormWins=Math.max(1,save.stormWins||0);save.bestStorm=30;save.unlocks.stormWin=true}
    else if(action==='give-everything'){save.gems=Math.max(save.gems,999999);save.totalGems=Math.max(save.totalGems||0,save.gems);save.candy=Math.max(save.candy,999999);save.stormShards=Math.max(save.stormShards||0,999999);save.enemyLevel=Math.max(save.enemyLevel,999);save.enemyXP=0;save.unlocks.halloweenWin=true;save.unlocks.autumnWin=true;save.unlocks.stormWin=true;unlockAllEnemies();for(const u of D.upgrades)save.upgrades[u.id]=u.max;for(const u of D.halloweenUpgrades)save.halloweenUpgrades[u.id]=u.max;for(const u of D.stormUpgrades)save.stormUpgrades[u.id]=u.max;save.wins=Math.max(1,save.wins||0);save.hardWins=Math.max(1,save.hardWins||0);save.halloweenWins=Math.max(1,save.halloweenWins||0);save.autumnWins=Math.max(1,save.autumnWins||0);save.bestWave=50;save.bestHard=50;save.bestStorm=30}
    else if(action==='force-enemy-now'){const id=$('ownerEnemyOverrideSelect')?.value;if(!window.ENEMY_MODE?.isRunning?.())return toast('Start Enemy Mode first.');const result=window.ENEMY_MODE?.ownerSetEnemy?.(id);ownerSync();show('pause');return toast(result?.ok?`Owner override: ${result.name} at Wave ${result.wave}.`:'Could not override enemy.',2100)}
    else if(action==='set-current-wave'){const target=clampOwner('ownerCurrentWave',1,50,1);let result=null;if(window.ENEMY_MODE?.isRunning?.())result=window.ENEMY_MODE?.ownerSetWave?.(target);else if(window.BUGBREAK_GAME?.isRunning?.())result=window.BUGBREAK_GAME?.ownerSetWave?.(target);else return toast('Start a round first.');ownerSync();show('pause');window.AudioSys?.sfx?.('wave',.38);return toast(`Current round rebuilt at Wave ${result?.wave||target}.`,1900)}
    else if(action==='refresh-owner'){}
    ownerSync();window.AudioSys?.sfx?.('gem',.3);toast('Owner change saved.');
  }
  $('ownerAccessBtn')?.addEventListener('click',()=>{if(ownerUnlocked){ownerSync();show('ownerMenu')}else{const i=$('ownerCodeInput');if(i)i.value='';const st=$('ownerGateStatus');if(st)st.textContent='Locked.';show('ownerGate');setTimeout(()=>i?.focus(),50)}});
  $('ownerGateClose')?.addEventListener('click',()=>show('settings'));
  $('ownerMenuClose')?.addEventListener('click',()=>show('settings'));
  $('ownerUnlockBtn')?.addEventListener('click',async()=>{const input=$('ownerCodeInput');const st=$('ownerGateStatus');const h=await ownerHash(input?.value||'');if(h!==OWNER_HASH){if(st)st.textContent='Wrong code.';if(input){input.value='';input.focus()}return}ownerUnlocked=true;if(st)st.textContent='Verified.';renderOwnerEnemyOverride();renderCustomBugList();setBugDraft(null);ownerSync();show('ownerMenu')});
  $('ownerCodeInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('ownerUnlockBtn')?.click()});
  document.querySelectorAll('[data-owner-action]').forEach(b=>b.addEventListener('click',()=>ownerAction(b.dataset.ownerAction)));
  $('ownerBugStudioBtn')?.addEventListener('click',()=>{if(!ownerUnlocked)return toast('Owner menu locked.');renderCustomBugList();drawCustomBugPreview();show('ownerBugStudio')});
  $('ownerBugStudioClose')?.addEventListener('click',()=>{ownerSync();show('ownerMenu')});
  $('customBugNewBtn')?.addEventListener('click',()=>setBugDraft(null));$('customBugSaveBtn')?.addEventListener('click',saveCustomBug);
  ['customBugName','customBugBody','customBugHead','customBugWings','customBugLegs','customBugAntennae','customBugPrimary','customBugSecondary','customBugGradient','customBugAlpha','customBugScale','customBugHp','customBugDamage','customBugSpeed','customBugCrit','customBugCooldown','customBugAbility','customBugAbilityName','customBugDesc'].forEach(id=>field(id)?.addEventListener('input',drawCustomBugPreview));
  $('defenderSideBtn')?.addEventListener('click',()=>{save.playSide='defender';persist();syncSide();window.AudioSys.ui()});$('enemySideBtn')?.addEventListener('click',()=>{save.playSide='enemy';persist();syncSide();window.AudioSys.ui()});
  const openEnemyMarket=()=>{renderEnemyShop();show('enemyShop');window.AudioSys.ui()};$('enemyShopBtn')?.addEventListener('click',openEnemyMarket);$('inlineEnemyShopBtn')?.addEventListener('click',openEnemyMarket);$('enemyShopClose')?.addEventListener('click',()=>show(window.BUGBREAK_GAME?.isRunning?.()?'pause':'menu'));
  $('shopBtn').addEventListener('click',()=>{renderShop();show('shop');window.AudioSys.ui()});document.querySelector('[data-close="shop"]').addEventListener('click',()=>show(window.BUGBREAK_GAME?.isRunning?.()?'pause':'menu'));
  $('settingsBtn').addEventListener('click',()=>{settingsUI();show('settings');window.AudioSys.ui()});$('settingsClose').addEventListener('click',()=>show((window.BUGBREAK_GAME?.isRunning?.()||window.ENEMY_MODE?.isRunning?.())?'pause':'menu'));
  $('resetBtn').addEventListener('click',()=>{if(confirm('Reset BUGBREAK progress, event rewards and upgrades?'))reset()});$('pauseShopBtn').addEventListener('click',()=>{renderShop();show('shop')});$('pauseSettingsBtn').addEventListener('click',()=>{settingsUI();show('settings')});$('roundShopBtn').addEventListener('click',()=>window.BUGBREAK_GAME?.openRoundShop?.());
  settingsUI();syncMenu();
  window.UI={show,toast,renderShop,syncMenu,addGems,addCandy,addStormShards,recordWave,win,persist,halloweenActive,autumnActive,seasonActive,get save(){return save},set save(v){save=v;persist()},get selectedBug(){return save.selectedBug},getPlayerSpec,get selectedMode(){return save.selectedMode},get settings(){return save.settings},get upgrades(){return save.upgrades},get halloweenUpgrades(){return save.halloweenUpgrades},get stormUpgrades(){return save.stormUpgrades},get playSide(){return save.playSide},get ownerUnlocked(){return ownerUnlocked},get enemyLevel(){return save.enemyLevel},get enemyXP(){return save.enemyXP},get selectedEnemy(){return selectedEnemyEntry()},enemyCatalog,enemySpec,enemyOwned,enemyXpNeed,addEnemyXp,renderEnemyLoadout,renderEnemyShop,drawCustomBugShape:drawBugShape,upCost};
})();
