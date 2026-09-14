/* ============================================================================
   COEM Wiring Lab — application shell
   Lab index, routing, wiring rules, scoring and the per-experiment simulation.
   ========================================================================== */
(function(){
"use strict";
const $  = s=>document.querySelector(s);
const $$ = s=>Array.from(document.querySelectorAll(s));
const EXPS = window.EXPERIMENTS;

/* ---------- persistence -------------------------------------------------- */
const KEY = 'coem.progress.v1';
let progress = {best:{}};
try{ const r = localStorage.getItem(KEY); if(r) progress = Object.assign(progress, JSON.parse(r)); }catch(e){}
const save = ()=>{ try{ localStorage.setItem(KEY, JSON.stringify(progress)); }catch(e){} };

/* ---------- run state ---------------------------------------------------- */
const R = {
  spec:null, errors:0, hints:0, correct:0, t0:0, finished:false,
  motorRpm:0, cycleDone:false, sppProven:false,
  ran:false, sawStop:false, phaseWasOpen:false, running:false
};
let expectedMap = new Map();

/* ---------- small ui helpers -------------------------------------------- */
let toastTimer=null;
function toast(msg, kind){
  const el = $('#toast');
  el.textContent = msg; el.className = 'show'+(kind?' '+kind:'');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>{ el.className=''; }, 3800);
}
function openSheet(o){
  $('#sheetEyebrow').textContent = o.eyebrow||'';
  $('#sheetTitle').textContent = o.title||'';
  $('#sheetBody').innerHTML = o.html||'';
  const f = $('#sheetFoot'); f.innerHTML='';
  (o.buttons||[]).forEach(b=>{
    const n = document.createElement('button');
    n.className = 'btn'+(b.cls?' '+b.cls:''); n.textContent = b.label;
    n.onclick = ()=>{ if(b.act) b.act(); };
    f.appendChild(n);
  });
  $('#scrim').classList.add('show');
}
const closeSheet = ()=> $('#scrim').classList.remove('show');
$('#scrim').addEventListener('pointerdown', e=>{ if(e.target===$('#scrim')) closeSheet(); });

/* ============================================================== LAB INDEX */
function renderHome(){
  const list = $('#labList'); list.innerHTML = '';
  let done = 0, total = 0;
  EXPS.forEach(x=>{
    const best = progress.best[x.id]||0;
    if(best){ done++; total += best; }
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = 'lab-item';
    if(x.soon) b.disabled = true;
    b.innerHTML =
      '<span class="lab-no">'+String(x.id).padStart(2,'0')+'</span>'+
      '<span class="lab-txt"><h2>'+x.title+'</h2><p>'+x.aim+'</p></span>'+
      '<span class="lab-meta">'+
        '<span class="tag '+(x.soon?'':(best?'done':'ready'))+'">'+(x.soon?'In development':(best?'Completed':'Ready'))+'</span>'+
        (best?'<span class="score">Best '+best+' / 1000</span>':'')+
      '</span>';
    if(!x.soon) b.onclick = ()=>{ location.hash = '#exp'+x.id; };
    li.appendChild(b); list.appendChild(li);
  });
  $('#homeDone').textContent = done;
  $('#homeBest').textContent = total;
}

/* ================================================================ ROUTING */
function route(){
  const m = /^#exp(\d+)$/.exec(location.hash||'');
  if(m){
    const spec = EXPS.find(x=>x.id===+m[1] && !x.soon);
    if(spec){ startExperiment(spec); return; }
  }
  showHome();
}
function showHome(){
  R.spec = null;
  $('#sim').hidden = true; $('#home').hidden = false;
  renderHome();
}
window.addEventListener('hashchange', route);

/* =============================================================== 3D BOOT */
const three = ENG.init($('#stage'));
let lastT = performance.now(), hudClock = 0;

function startExperiment(spec){
  $('#home').hidden = true; $('#sim').hidden = false;
  R.spec = spec; R.errors = 0; R.hints = 0; R.correct = 0; R.finished = false;
  R.motorRpm = 0; R.cycleDone = false; R.sppProven = false;
  R.ran = false; R.sawStop = false; R.phaseWasOpen = false; R.running = false;
  R.t0 = Date.now();
  expectedMap = new Map(spec.expected.map(e=>[ENG.pairKey(e.a,e.b), e]));
  ENG.load(spec);
  ENG.setLabelMode(ENG.sim.labelMode);
  $('#expTitle').textContent = spec.title;
  $('#expCode').textContent = spec.code+' · '+spec.short;
  $('#objTitle').textContent = 'Aim';
  $('#objText').textContent = spec.aim;
  buildDock(spec);
  buildFinder();
  resize();
  refresh();
  showLearn();
}

/* ============================================================ WIRING RULES */
const tName = id=>{ const t = ENG.sim.terminals[id]; return t ? t.compLabel+' '+t.name : id; };

function wrongWireMessage(a,b){
  const A = ENG.sim.terminals[a], B = ENG.sim.terminals[b];
  const sup = R.spec.supply||'SUP';
  if((A.comp===sup&&A.cls==='power'&&B.comp===sup&&B.cls==='neutral') ||
     (B.comp===sup&&B.cls==='power'&&A.comp===sup&&A.cls==='neutral'))
    return 'That links a line straight to neutral — a short circuit. A coil has to sit between them.';
  if(A.comp===B.comp)
    return 'Both ends land on '+A.compLabel+'. A wire has to carry the circuit on to the next device.';
  if(A.cls!==B.cls && (A.cls==='power'||B.cls==='power'))
    return 'Power and control terminals do not join here. Keep the motor circuit and the coil circuit apart.';
  if(A.cls==='power'&&B.cls==='power'){
    const pa = A.phase, pb = B.phase;
    if(pa&&pb&&pa!==pb) return 'Phase mismatch — L'+pa+' must not meet L'+pb+'. Follow each phase straight down the panel.';
    return 'Not the next link in the power path: supply → MCB → contactor → overload → motor.';
  }
  return 'Not part of this control circuit. Open the circuit diagram and trace the branch you are building.';
}

ENG.on('connect', (a,b)=>{
  if(!R.spec || a===b) return;
  if(ENG.hasWire(a,b)){ toast('Those terminals are already linked.'); return; }
  const exp = expectedMap.get(ENG.pairKey(a,b));
  if(exp){
    ENG.addWire(a,b,true); R.correct++;
    toast('Connected  '+tName(a)+'  →  '+tName(b), 'ok');
  }else{
    ENG.addWire(a,b,false); R.errors++;
    toast(wrongWireMessage(a,b), 'bad');
  }
  refresh();
});
ENG.on('wireRemoved', ()=>{ toast('Wire removed.'); setTimeout(refresh, 0); });
ENG.on('select', id=>{ /* hover highlight handled in the engine */ });

ENG.on('buttonDown', (compId, ctl)=>{
  const c = ENG.sim.comps[compId]; if(!c) return;
  if(ctl==='press'){ c.st.pressed = true; }
  else if(ctl==='reset'){ resetRelay(compId); }
  else if(ctl==='toggle'){ c.st.on = !c.st.on; toast((c.inst.tag||compId)+' switched '+(c.st.on?'ON':'OFF')); }
  refresh();
});
ENG.on('buttonUp', ()=>{
  let any = false;
  ENG.sim.compList.forEach(c=>{ if(c.st.pressed){ c.st.pressed = false; any = true; } });
  if(any) refresh();
});

/* =============================================================== CONTROLS */
function buildDock(spec){
  const host = $('#opControls'); host.innerHTML = '';
  (spec.controls||[]).forEach(ct=>{
    const b = document.createElement('button');
    b.className = 'btn'+(ct.cls?' '+ct.cls:''); b.textContent = ct.label; b.dataset.ctl = ct.id;
    if(ct.kind==='hold'){
      const dn = ()=>{ const c = ENG.sim.comps[ct.comp]; if(c){ c.st.pressed = true; refresh(); } };
      const up = ()=>{ const c = ENG.sim.comps[ct.comp]; if(c && c.st.pressed){ c.st.pressed = false; refresh(); } };
      b.addEventListener('pointerdown', dn);
      ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev, up));
    }else{
      b.onclick = ()=>doAction(ct);
    }
    host.appendChild(b);
  });
}
function doAction(ct){
  if(ct.id==='ol'){ simulateOverload(); return; }
  if(ct.id==='reset'){ resetRelay('F2'); return; }
  if(ct.id==='ph2'){
    const s = ENG.sim.comps[R.spec.supply||'SUP'];
    s.st.phaseOut[1] = !s.st.phaseOut[1];
    const open = !s.st.phaseOut[1];
    if(open) R.phaseWasOpen = true;
    toast(open ? 'Line L2 removed at the source — the supply is now single-phasing.'
               : 'Line L2 restored. Press START to run again.', open?'bad':'ok');
    refresh();
  }
}
function simulateOverload(){
  const f = ENG.sim.comps['F2']; if(!f) return;
  if(!R.running){ toast('Start the motor first — the relay only trips on running load.'); return; }
  f.st.tripped = true; refresh();
  setTimeout(()=>openSheet({
    eyebrow:'Protection operated', title:'Overload tripped',
    html:'<p class="note bad">The overload relay protects the motor against sustained overcurrent. '+
         'Its 95-96 contact has opened, the coil circuit has collapsed, the contactor has dropped out '+
         'and the motor is coasting to rest.</p>'+
         '<p>Press <strong>Reset relay</strong> — or the RESET button on the relay itself — then start again. '+
         'On real equipment you would find the cause of the overload before resetting.</p>',
    buttons:[{label:'Understood', cls:'primary', act:closeSheet}]
  }), 480);
}
function resetRelay(id){
  const f = ENG.sim.comps[id||'F2']; if(!f || f.def!==window.PARTS.olr) return;
  if(!f.st.tripped){ toast('The overload relay is already healthy.'); return; }
  f.st.tripped = false; toast('Overload relay reset.', 'ok'); refresh();
}

/* ========================================================= TERMINAL FINDER */
function buildFinder(){
  const chips = $('#compChips'); chips.innerHTML = '';
  const seen = [];
  ENG.sim.termList.forEach(t=>{ if(!seen.includes(t.comp)) seen.push(t.comp); });
  seen.forEach(id=>{
    const b = document.createElement('button');
    b.textContent = (ENG.sim.comps[id].inst.tag)||id;
    b.onclick = ()=>{ ENG.focusComponent(id); toast('Showing '+b.textContent); };
    chips.appendChild(b);
  });
  const all = document.createElement('button');
  all.textContent = 'Whole panel'; all.onclick = ()=>ENG.resetView();
  chips.appendChild(all);
  renderFinder('');
}
function renderFinder(q){
  const ul = $('#findList'); ul.innerHTML = '';
  const needle = q.trim().toLowerCase();
  const rows = ENG.sim.termList.filter(t=>{
    if(!needle) return true;
    return (t.name+' '+t.compLabel+' '+t.comp+' '+t.desc).toLowerCase().includes(needle);
  }).slice(0, 220);
  if(!rows.length){
    ul.innerHTML = '<li class="empty">No terminal matches that.</li>'; return;
  }
  rows.forEach(t=>{
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.innerHTML = '<span class="t-comp">'+t.compLabel+'</span><span class="t-name">'+t.name+'</span>'+
                  '<span class="t-desc">'+t.desc+'</span>';
    b.onclick = ()=>{ ENG.focusTerminal(t.id); toast('Showing '+tName(t.id)+' — '+t.desc); };
    li.appendChild(b); ul.appendChild(li);
  });
}
$('#findQ').addEventListener('input', e=>renderFinder(e.target.value));

/* ================================================================ SCORING */
const elapsed = ()=> Math.floor((Date.now()-R.t0)/1000);
function currentScore(){
  const over = Math.max(0, elapsed() - (R.spec?R.spec.par:300));
  return Math.max(0, Math.min(1000, 1000 - R.errors*40 - R.hints*25 - Math.min(150, Math.floor(over/4))));
}
const fmtTime = t => Math.floor(t/60)+':'+String(t%60).padStart(2,'0');

/* ============================================================ CHECK / HINT */
const groupPairs = g => R.spec.expected.filter(e=>e.g===g).map(e=>[e.a,e.b]);
function allWired(){
  return R.spec.expected.every(e=>ENG.hasWire(e.a,e.b)) && !ENG.sim.wires.some(w=>!w.ok);
}
function wireCheck(){
  let rows = '', ok = true;
  R.spec.groups.forEach(g=>{
    const pr = groupPairs(g.k);
    const done = pr.filter(p=>ENG.hasWire(p[0],p[1])).length;
    const good = done===pr.length; if(!good) ok = false;
    rows += '<div class="readout"><span class="k">'+(good?'&#10003; ':'&#10007; ')+g.label+'</span>'+
            '<span class="v" style="color:'+(good?'var(--ok)':'var(--alarm)')+'">'+done+' / '+pr.length+'</span></div>';
  });
  const bad = ENG.sim.wires.filter(w=>!w.ok);
  let extra = '';
  if(bad.length){
    ok = false;
    extra += '<div class="note bad"><strong>'+bad.length+' flagged wire'+(bad.length>1?'s':'')+'</strong> (magenta on the panel): '+
             bad.map(w=>tName(w.a)+' → '+tName(w.b)).join('; ')+'. Tap a flagged wire twice to remove it.</div>';
  }else{
    const missing = R.spec.expected.filter(e=>!ENG.hasWire(e.a,e.b));
    if(missing.length) extra += '<div class="note">Still missing: <strong>'+tName(missing[0].a)+' → '+tName(missing[0].b)+'</strong>'+
      (missing.length>1?' and '+(missing.length-1)+' more.':'.')+'</div>';
  }
  if(ENG.sim.fault) extra += '<div class="note bad"><strong>Fault:</strong> '+ENG.sim.fault+'</div>';
  openSheet({
    eyebrow:'Continuity report', title:'Connection status',
    html:'<div>'+rows+'</div>'+extra+
      (ok?'<div class="note good"><strong>READY TO START.</strong> Operate the panel with the START and STOP buttons — '+
          'on the panel itself or in the dock below.</div>':''),
    buttons:[{label:'Close', cls:'primary', act:closeSheet}]
  });
}
function giveHint(){
  const missing = R.spec.expected.find(e=>!ENG.hasWire(e.a,e.b));
  if(!missing){ toast('Every required wire is in place. Run a Wire Check.'); return; }
  R.hints++;
  ENG.focusTerminal(missing.a, {dist:1.15});
  ENG.sim.terminals[missing.b].hint = performance.now();
  toast('Next wire:  '+tName(missing.a)+'  →  '+tName(missing.b));
  refresh();
}

/* ================================================================== SHEETS */
function showLearn(){
  const s = R.spec;
  const parts = s.learn.parts.map(p=>'<div class="part"><b>'+p[0]+'</b><span>'+p[1]+'</span></div>').join('');
  openSheet({
    eyebrow:'Learn first · '+s.code, title:s.title,
    html:'<p style="font-size:14px;color:var(--ink)">'+s.learn.lead+'</p>'+
         '<div class="parts">'+parts+'</div>'+
         '<div class="note">'+s.learn.note+'</div>',
    buttons:[
      {label:'Circuit diagram', act:()=>{ closeSheet(); openDrawer(); }},
      {label:'Start wiring', cls:'primary', act:closeSheet}
    ]
  });
}
function finish(){
  R.finished = true;
  const s = R.spec, score = currentScore(), t = elapsed();
  const acc = (R.correct+R.errors) ? Math.round(R.correct/(R.correct+R.errors)*100) : 100;
  progress.best[s.id] = Math.max(progress.best[s.id]||0, score); save();
  const next = EXPS.find(x=>x.id===s.id+1 && !x.soon);
  setTimeout(()=>openSheet({
    eyebrow:s.code+' complete', title:'Result',
    html:'<div class="bigscore">'+score+' <span style="font-size:20px;color:var(--ink-faint)">/ 1000</span></div>'+
      '<p class="note good">'+s.winText+'</p>'+
      '<div class="scoregrid">'+
        '<div><b>'+acc+'%</b><span>Accuracy</span></div>'+
        '<div><b>'+fmtTime(t)+'</b><span>Time</span></div>'+
        '<div><b>'+R.errors+'</b><span>Wiring errors</span></div>'+
        '<div><b>'+R.hints+'</b><span>Hints used</span></div>'+
      '</div>'+
      '<p><strong>Result.</strong> '+s.result+'</p>',
    buttons:[
      {label:'Lab index', act:()=>{ closeSheet(); location.hash=''; }},
      {label:'Rebuild this one', act:()=>{ closeSheet(); startExperiment(s); }}
    ].concat(next?[{label:'Next: '+next.short, cls:'primary', act:()=>{ closeSheet(); location.hash='#exp'+next.id; }}]:[])
  }), 1200);
}

/* ================================================================= DRAWER */
function openDrawer(){
  $('#drawerTitle').textContent = R.spec.code+' — '+R.spec.title;
  $('#drawerBody').innerHTML = R.spec.diagram();
  $('#drawer').hidden = false;
}
$('#drawerClose').onclick = ()=>{ $('#drawer').hidden = true; };

/* ================================================================ REFRESH */
function statusRows(){
  let h = '';
  const row = (k,v)=> h += '<div class="readout"><span class="k">'+k+'</span>'+v+'</div>';
  const pill = (txt,cls)=>'<span class="pill'+(cls?' '+cls:'')+'">'+txt+'</span>';
  ENG.sim.compList.forEach(c=>{
    const tag = c.inst.tag||c.id, P = window.PARTS;
    if(c.def===P.contactor3p) row(tag+' coil', pill(c.st.energised?'Energised':'De-energised', c.st.energised?'on':''));
    else if(c.def===P.relay)  row(tag, pill(c.st.energised?'Picked up':'Released', c.st.energised?'on':''));
    else if(c.def===P.timer){
      const done = c.st.energised && c.st.elapsed>=(c.inst.preset||5);
      row(tag+' timer', pill(done?'Timed out':(c.st.energised?c.st.elapsed.toFixed(1)+' s':'Reset'),
                             done?'on':(c.st.energised?'warn':'')));
    }
    else if(c.def===P.olr) row('Overload', pill(c.st.tripped?'Tripped':'Healthy', c.st.tripped?'bad':'on'));
    else if(c.def===P.spp) row('Preventer', pill(c.st.healthy===false?'Phase fault':'Healthy', c.st.healthy===false?'bad':'on'));
    else if(c.def===P.proximity) row('Proximity S3', pill(c.st.present?'Metal detected':'Clear', c.st.present?'warn':''));
    else if(c.def===P.mcb3) row(tag+' MCB', pill(c.st.on?'Closed':'Open', c.st.on?'on':'bad'));
    else if(c.def===P.motor3){
      row('Motor', pill(c.st.rpm>40?(c.st.dir<0?'Running rev':'Running'):'Stopped', c.st.rpm>40?'on':''));
      row('Speed', '<span class="v">'+Math.round(c.st.rpm)+' rpm</span>');
      h += '<div class="gauge"><i style="width:'+(c.st.rpm/1440*100).toFixed(0)+'%"></i></div>';
    }
    else if(c.def===P.supply3){
      const st = c.st.phaseOut;
      if(st.some(v=>v===false)) row('Supply', pill('Phase missing','bad'));
    }
  });
  return h;
}
function refresh(){
  if(!R.spec) return;
  $('#hudScore').textContent = currentScore();
  $('#hudErr').textContent = R.errors;
  $('#statusBody').innerHTML = statusRows();
  let html = '';
  R.spec.groups.forEach(g=>{
    const pr = groupPairs(g.k);
    const done = pr.filter(p=>ENG.hasWire(p[0],p[1])).length;
    const ok = done===pr.length;
    html += '<li class="'+(ok?'done':'')+'"><span class="mk">'+(ok?'&#10003;':'&#9679;')+'</span>'+
            '<span>'+g.label+'  <span style="opacity:.7">'+done+'/'+pr.length+'</span></span></li>';
  });
  const bad = ENG.sim.wires.filter(w=>!w.ok).length;
  if(bad) html += '<li class="bad"><span class="mk">&#10007;</span><span>'+bad+' flagged wire'+(bad>1?'s':'')+' to remove</span></li>';
  $('#checklist').innerHTML = html;
  const ready = allWired();
  $('#objTitle').textContent = ready ? 'Ready to start' : 'Aim';
  $('#objTitle').style.color = ready ? 'var(--ok)' : '';
}

/* ====================================================== SIMULATION UPDATE */
function step(dt){
  if(!R.spec) return;
  const S = ENG.sim, P = window.PARTS;

  /* sensors that depend on mechanics, evaluated before the netlist */
  const cv = S.compList.find(c=>c.def===P.conveyor);
  const px = S.compList.find(c=>c.def===P.proximity);
  if(cv && px){
    const d = Math.abs((cv.st.objX!==undefined?cv.st.objX:-99) - (R.spec.sensorAt||0));
    px.st.present = d < 0.075;
  }

  let uf = ENG.solve();

  /* single-phasing preventer sees the three source nodes */
  const sp = S.compList.find(c=>c.def===P.spp);
  if(sp){
    const ph = R.spec.rails.phases;
    const seen = ['R','Y','B'].map(n=>{
      for(let i=0;i<3;i++) if(uf.same(sp.id+'.'+n, ph[i])) return i;
      return -1;
    });
    sp.st.phaseSeen = seen.map(v=>v>=0);
    const distinct = new Set(seen.filter(v=>v>=0));
    const healthy = distinct.size===3;
    if(healthy !== (sp.st.healthy!==false)){ sp.st.healthy = healthy; uf = ENG.solve(); }
    sp.st.healthy = healthy;
  }

  /* timers */
  S.compList.forEach(c=>{
    if(c.def!==P.timer) return;
    if(c.st.energised) c.st.elapsed += dt; else c.st.elapsed = 0;
  });

  /* motors */
  let anyRunning = false, rpm = 0;
  S.compList.forEach(c=>{
    if(c.def!==P.motor3) return;
    const dir = ENG.motorDirection(c.id);
    const target = dir ? 1440 : 0;
    if(dir) c.st.dir = dir;
    c.st.rpm += (target - c.st.rpm) * Math.min(1, dt*(dir?1.05:0.7));
    if(c.st.rpm < 3 && !dir) c.st.rpm = 0;
    if(c.st.rpm > 40) anyRunning = true;
    rpm = Math.max(rpm, c.st.rpm);
  });
  R.motorRpm = rpm; R.running = anyRunning;

  /* conveyor follows its drive motor */
  if(cv){
    const m = S.compList.find(c=>c.def===P.motor3);
    cv.st.speed = m ? (m.st.rpm/1440)*0.34 : 0;
  }

  /* experiment-specific completion tracking */
  if(R.spec.id===2){
    if(rpm>900) { if(R.sawStop) R.cycleDone = true; R.ran = true; }
    if(R.ran && rpm<150 && px && px.st.present) R.sawStop = true;
  }
  if(R.spec.id===3){
    if(rpm>1000) R.ran = true;
    const km = S.comps['KM1'];
    if(R.ran && R.phaseWasOpen && km && !km.st.energised && rpm<400) R.sppProven = true;
  }

  /* animation */
  S.compList.forEach(c=>{ if(c.def.anim) c.def.anim(c, dt); });
}

/* =================================================================== LOOP */
function tick(now){
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, (now-lastT)/1000); lastT = now;
  if(R.spec){
    step(dt);
    ENG.updateCameraFly(dt);
    ENG.updateTerminalRings(now);
    hudClock += dt;
    if(hudClock > 0.25){
      hudClock = 0;
      $('#hudTime').textContent = fmtTime(elapsed());
      refresh();
      if(!R.finished && R.spec.win(R)) finish();
    }
    ENG.render();
  }
}
function resize(){
  const w = window.innerWidth, h = window.innerHeight;
  ENG.resize(w, h, w<760);
}
window.addEventListener('resize', resize);

/* ================================================================ WIRE-UP */
$('#btnHome').onclick   = ()=>{ location.hash = ''; };
$('#btnCheck').onclick  = wireCheck;
$('#btnHint').onclick   = giveHint;
$('#btnClear').onclick  = ()=>{ ENG.clearWires(); ENG.clearSelection(); refresh(); toast('Panel wiring cleared.'); };
$('#btnLearn').onclick  = showLearn;
$('#btnDiagram').onclick= openDrawer;
$('#btnLabels').onclick = ()=>{
  const m = (ENG.sim.labelMode+1)%3;
  ENG.setLabelMode(m);
  $('#btnLabels').textContent = 'Labels: '+['Off','Normal','Large'][m];
  $('#btnLabels').classList.toggle('on', m===2);
};
$$('.railtabs .btn').forEach(b=>{
  b.onclick = ()=>{
    const t = b.dataset.rail==='left' ? $('#railLeft') : $('#railRight');
    const o = b.dataset.rail==='left' ? $('#railRight') : $('#railLeft');
    o.classList.remove('open'); t.classList.toggle('open');
  };
});
window.addEventListener('keydown', e=>{
  if(e.key==='Escape'){ ENG.clearSelection(); closeSheet(); $('#drawer').hidden = true; }
  if(!R.spec || e.repeat) return;
  if(e.key==='s'||e.key==='S'){ const c = ENG.sim.comps['S2']; if(c){ c.st.pressed = true; refresh(); } }
  if(e.key==='x'||e.key==='X'){ const c = ENG.sim.comps['S1']; if(c){ c.st.pressed = true; refresh(); } }
});
window.addEventListener('keyup', e=>{
  if(!R.spec) return;
  if(e.key==='s'||e.key==='S'||e.key==='x'||e.key==='X') ENG.emit('buttonUp');
});

resize();
route();
requestAnimationFrame(tick);
})();
