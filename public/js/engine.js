/* ============================================================================
   COEM Lab Simulator — engine
   Scene, materials, terminals, wires, the circuit solver and pointer input.
   Everything here is generic; component geometry lives in parts.js and the
   experiment definitions live in experiments.js.
   ========================================================================== */
window.ENG = (function(){
"use strict";

const T = window.THREE;

/* ---------- renderer / scene ------------------------------------------- */
let renderer, scene, camera, world, canvas, key;
const camTarget = new T.Vector3();
const cam = {az:0.24, el:0.26, dist:3.2, minDist:0.9, maxDist:6.0};
let flyTo = null;

function applyCamera(){
  cam.el = Math.max(-0.30, Math.min(1.18, cam.el));
  cam.az = Math.max(-1.15, Math.min(1.15, cam.az));
  cam.dist = Math.max(cam.minDist, Math.min(cam.maxDist, cam.dist));
  camera.position.set(
    camTarget.x + cam.dist*Math.cos(cam.el)*Math.sin(cam.az),
    camTarget.y + cam.dist*Math.sin(cam.el),
    camTarget.z + cam.dist*Math.cos(cam.el)*Math.cos(cam.az));
  camera.lookAt(camTarget);
}

/* ---------- materials --------------------------------------------------- */
const M = {};
function initMaterials(){
  const std = (o)=> new T.MeshStandardMaterial(o);
  Object.assign(M, {
    bench:     std({color:0x222930, roughness:0.94, metalness:0.05}),
    benchEdge: std({color:0x171c21, roughness:0.80, metalness:0.20}),
    panel:     std({color:0x7e837d, roughness:0.78, metalness:0.18}),
    panelEdge: std({color:0x6f746f, roughness:0.55, metalness:0.42}),
    din:       std({color:0xb7bcc2, roughness:0.36, metalness:0.85}),
    plasticDk: std({color:0x2b3036, roughness:0.55, metalness:0.05}),
    plasticMd: std({color:0x3d444b, roughness:0.62, metalness:0.05}),
    plasticLt: std({color:0xada89b, roughness:0.72, metalness:0.04}),
    plasticBlk:std({color:0x1d2126, roughness:0.50, metalness:0.06}),
    glass:     std({color:0x9fb6c6, roughness:0.12, metalness:0.0, transparent:true, opacity:0.20, side:T.DoubleSide}),
    brass:     std({color:0xc8a15c, roughness:0.33, metalness:0.92}),
    steel:     std({color:0xa8aeb5, roughness:0.30, metalness:0.90}),
    copper:    std({color:0xb4703c, roughness:0.34, metalness:0.88}),
    coil:      std({color:0x6a4a22, roughness:0.70, metalness:0.25}),
    motorBody: std({color:0x3c6f7a, roughness:0.48, metalness:0.40}),
    motorFin:  std({color:0x336069, roughness:0.55, metalness:0.35}),
    red:       std({color:0xc23a33, roughness:0.42, metalness:0.05}),
    green:     std({color:0x2f8f4c, roughness:0.42, metalness:0.05}),
    amber:     std({color:0xc98a1e, roughness:0.42, metalness:0.05}),
    resistor:  std({color:0x6b6f74, roughness:0.85, metalness:0.15})
  });
}
function ledMat(c){ return new T.MeshStandardMaterial({color:c, emissive:0x000000, roughness:0.25, metalness:0.1}); }

/* ---------- primitives -------------------------------------------------- */
const box = (w,h,d,m)=> new T.Mesh(new T.BoxGeometry(w,h,d), m);
const cyl = (rt,rb,h,m,s)=> new T.Mesh(new T.CylinderGeometry(rt,rb,h,s||18), m);
function shade(o){ o.castShadow = true; o.receiveShadow = true; return o; }

/* ---------- canvas text labels ------------------------------------------ */
const labelCache = new Map();
function makeLabel(text, opt){
  opt = opt||{};
  const fs = opt.fs||64, pad = opt.pad!==undefined?opt.pad:14;
  const font = (opt.weight||600)+' '+fs+'px '+(opt.mono?'"IBM Plex Mono",monospace':'"Saira Condensed","Arial Narrow",sans-serif');
  const ck = text+'|'+font+'|'+(opt.color||'#fff')+'|'+(opt.bg||'-')+'|'+(opt.ls||0);
  let tex = labelCache.get(ck);
  if(!tex){
    const c = document.createElement('canvas'), g = c.getContext('2d');
    g.font = font;
    const ls = opt.ls||0;
    c.width  = Math.max(8, Math.ceil(g.measureText(text).width + ls*text.length) + pad*2);
    c.height = Math.max(8, Math.ceil(fs*1.34) + pad*2);
    const x = c.getContext('2d');
    if(opt.bg){
      x.fillStyle = opt.bg;
      const r = Math.min(18, c.height/3);
      x.beginPath();
      x.moveTo(r,0); x.arcTo(c.width,0,c.width,c.height,r); x.arcTo(c.width,c.height,0,c.height,r);
      x.arcTo(0,c.height,0,0,r); x.arcTo(0,0,c.width,0,r); x.closePath(); x.fill();
    }
    x.font = font; x.fillStyle = opt.color||'#ffffff';
    x.textBaseline = 'middle'; x.textAlign = 'left';
    let cx = pad;
    for(const ch of text){ x.fillText(ch, cx, c.height/2 + fs*0.03); cx += x.measureText(ch).width + ls; }
    tex = new T.CanvasTexture(c);
    tex.anisotropy = 4; tex.encoding = T.sRGBEncoding;
    tex.userData = {ar: c.width/c.height};
    labelCache.set(ck, tex);
  }
  const h = opt.h||0.03, w = h*tex.userData.ar;
  const mesh = new T.Mesh(new T.PlaneGeometry(w,h),
    new T.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false, depthTest:opt.depthTest!==false}));
  mesh.renderOrder = opt.order||3;
  mesh.userData.labelW = w;
  return mesh;
}

/* ============================================================================
   SIMULATION STATE
   ========================================================================== */
const sim = {
  spec:null,
  comps:{},            // id -> component runtime
  compList:[],
  terminals:{},        // "COMP.TERM" -> record
  termList:[],
  wires:[],
  pickables:[],
  fault:'',
  chatter:false,
  uf:null,
  selTerm:null,
  selWire:null,
  hoverTerm:null,
  labelMode:1          // 0 off, 1 normal, 2 large
};

/* ---------- terminals --------------------------------------------------- */
function addTerminal(parent, compId, name, x, y, z, opt){
  opt = opt||{};
  const id = compId+'.'+name;
  const g = new T.Group(); g.position.set(x,y,z);

  const housing = shade(box(0.046,0.046,0.024, M.plasticBlk));
  housing.position.z = 0.012; g.add(housing);
  const screw = cyl(0.016,0.016,0.013, M.brass, 20);
  screw.rotation.x = Math.PI/2; screw.position.z = 0.027; shade(screw); g.add(screw);
  const slot = box(0.022,0.0035,0.004, M.plasticBlk); slot.position.z = 0.0345; g.add(slot);

  const ring = new T.Mesh(new T.RingGeometry(0.023,0.034,28),
    new T.MeshBasicMaterial({color:0xe07b39, transparent:true, opacity:0, side:T.DoubleSide, depthTest:false}));
  ring.position.z = 0.036; ring.renderOrder = 4; g.add(ring);

  const hit = new T.Mesh(new T.SphereGeometry(0.046,10,8), new T.MeshBasicMaterial({visible:false}));
  hit.position.z = 0.022; g.add(hit);

  // the marking, printed twice: small always-on, large for "big labels" mode
  const cls = opt.cls||'control';
  const col = opt.lc || (cls==='power' ? '#f2f5f7' : cls==='neutral' ? '#bcd9f2' : '#ffd2a8');
  const small = makeLabel(name, {h:0.028, color:col, ls:1});
  const big   = makeLabel(name, {h:0.040, color:'#0d1114', ls:1, bg:col, pad:22, order:6, depthTest:false});
  const dir = opt.labelPos||'above';
  [small,big].forEach((L,i)=>{
    const off = 0.044 + (i? (L.geometry.parameters.height*0.5 - 0.014) : 0);
    if(dir==='above')      L.position.set(0,  off, 0.034);
    else if(dir==='below') L.position.set(0, -off, 0.034);
    else if(dir==='left')  L.position.set(-0.040 - L.userData.labelW/2, 0, 0.034);
    else                   L.position.set( 0.040 + L.userData.labelW/2, 0, 0.034);
    g.add(L);
  });
  big.visible = false;

  parent.add(g);
  const rec = {id, comp:compId, name, group:g, ring, small, big, cls,
               world:new T.Vector3(), hint:0,
               compLabel:opt.compLabel||compId, desc:opt.desc||''};
  [hit,screw,housing].forEach(o=>{ o.userData = {kind:'terminal', id}; sim.pickables.push(o); });
  sim.terminals[id] = rec; sim.termList.push(rec);
  return rec;
}

/* ---------- wires ------------------------------------------------------- */
const WIRE_COLOR = {L1:0x8a5a34, L2:0x15181b, L3:0x8d949b, N:0x3f8fd0, C:0xcf3b34,
                    E:0x7fa03a, DC:0x2f6fb0, BAD:0xff3ea5};
let wireGroup = null;

function wireCurve(pa, pb){
  const mid = pa.clone().add(pb).multiplyScalar(0.5);
  const d = pa.distanceTo(pb);
  const a1 = pa.clone().add(new T.Vector3(0,0,0.042));
  const b1 = pb.clone().add(new T.Vector3(0,0,0.042));
  mid.z = Math.max(pa.z,pb.z) + 0.028 + Math.min(0.030, d*0.02);
  return new T.CatmullRomCurve3([pa,a1,mid,b1,pb], false, 'catmullrom', 0.5);
}
function colorFor(aId,bId,ok){
  if(!ok) return WIRE_COLOR.BAD;
  const a = sim.terminals[aId], b = sim.terminals[bId];
  if(a.cls==='neutral'||b.cls==='neutral') return WIRE_COLOR.N;
  if(a.cls==='earth'||b.cls==='earth') return WIRE_COLOR.E;
  if(a.cls==='dc'||b.cls==='dc') return WIRE_COLOR.DC;
  if(a.cls==='power'&&b.cls==='power'){
    const ph = a.phase||b.phase;
    return ph===1?WIRE_COLOR.L1 : ph===2?WIRE_COLOR.L2 : ph===3?WIRE_COLOR.L3 : 0x707880;
  }
  return WIRE_COLOR.C;
}
function addWire(aId,bId,ok){
  const pa = sim.terminals[aId].world, pb = sim.terminals[bId].world;
  const geo = new T.TubeGeometry(wireCurve(pa,pb), 32, 0.0095, 8, false);
  const mat = new T.MeshStandardMaterial({color:colorFor(aId,bId,ok), roughness:0.45, metalness:0.05,
                                          emissive: ok?0x000000:0x3a0021});
  const mesh = shade(new T.Mesh(geo, mat));
  const w = {a:aId, b:bId, mesh, ok:!!ok};
  mesh.userData = {kind:'wire', wire:w};
  [pa,pb].forEach(p=>{
    const f = cyl(0.013,0.013,0.024, M.steel, 12);
    f.position.copy(p); f.position.z += 0.013; f.rotation.x = Math.PI/2; mesh.add(f);
  });
  wireGroup.add(mesh); sim.pickables.push(mesh); sim.wires.push(w);
  return w;
}
function removeWire(w){
  const i = sim.wires.indexOf(w); if(i<0) return;
  sim.wires.splice(i,1); wireGroup.remove(w.mesh);
  const p = sim.pickables.indexOf(w.mesh); if(p>=0) sim.pickables.splice(p,1);
  w.mesh.geometry.dispose(); w.mesh.material.dispose();
}
function clearWires(){ while(sim.wires.length) removeWire(sim.wires[0]); }
const pairKey = (a,b)=> a<b ? a+'|'+b : b+'|'+a;
const hasWire = (a,b)=> sim.wires.some(w=>pairKey(w.a,w.b)===pairKey(a,b));

/* ============================================================================
   CIRCUIT SOLVER
   Union-find over: every wire + every component's internal links for the
   current contact states. Coil states are found by iterating to a fixed point,
   which is what makes hold-in (latching) circuits work by themselves.
   ========================================================================== */
function buildUF(){
  const parent = Object.create(null);
  function find(x){
    if(parent[x]===undefined) parent[x] = x;
    while(parent[x]!==x){ parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  }
  function uni(a,b){ const ra=find(a), rb=find(b); if(ra!==rb) parent[ra]=rb; }
  for(const w of sim.wires) uni(w.a, w.b);
  for(const c of sim.compList){
    const links = c.links ? c.links() : [];
    for(const L of links) uni(c.id+'.'+L[0], c.id+'.'+L[1]);
  }
  return {find, same:(a,b)=>find(a)===find(b)};
}

function energisedOf(c, uf){
  if(!c.def.coil) return false;
  const a = c.id+'.'+c.def.coil.a, b = c.id+'.'+c.def.coil.b;
  const L = sim.spec.rails.live, N = sim.spec.rails.neutral;
  if(uf.same(L,N)) return false;                     // dead short across the rails
  return (uf.same(a,L)&&uf.same(b,N)) || (uf.same(a,N)&&uf.same(b,L));
}

function solve(){
  let uf = null, stable = false;
  for(let pass=0; pass<10; pass++){
    uf = buildUF();
    let changed = false;
    for(const c of sim.compList){
      if(!c.def.coil) continue;
      const e = energisedOf(c, uf);
      if(e !== c.st.energised){ c.st.energised = e; changed = true; }
    }
    if(!changed){ stable = true; break; }
  }
  sim.chatter = !stable;
  sim.uf = uf;

  /* supply faults */
  sim.fault = '';
  const R = sim.spec.rails;
  if(uf.same(R.live, R.neutral)) sim.fault = 'Short circuit across the control supply.';
  if(!sim.fault && R.phases && R.phases.length===3){
    const p = R.phases;
    for(let i=0;i<3 && !sim.fault;i++) for(let j=i+1;j<3;j++)
      if(uf.same(p[i],p[j])){ sim.fault = 'Phase-to-phase short between L'+(i+1)+' and L'+(j+1)+'.'; break; }
  }
  if(!sim.fault && sim.chatter) sim.fault = 'Relay chatter — a coil is being broken by its own contact.';
  return uf;
}

/* motor direction: 1 forward, -1 reverse, 0 not running */
function motorDirection(m){
  const uf = sim.uf; if(!uf) return 0;
  const p = sim.spec.rails.phases;
  const U = m+'.U', V = m+'.V', W = m+'.W';
  if(uf.same(U,p[0]) && uf.same(V,p[1]) && uf.same(W,p[2])) return 1;
  if(uf.same(U,p[2]) && uf.same(V,p[1]) && uf.same(W,p[0])) return -1;
  if(uf.same(U,p[1]) && uf.same(V,p[0]) && uf.same(W,p[2])) return -1;
  return 0;
}
function phaseLive(i){                       // is supply phase i present at its outgoing terminal?
  const uf = sim.uf; if(!uf) return false;
  const sup = sim.spec.supply||'SUP';
  return uf.same(sim.spec.rails.phases[i], sup+'.L'+(i+1));
}

/* ============================================================================
   BOOT / SCENE
   ========================================================================== */
function init(canvasEl){
  canvas = canvasEl;
  renderer = new T.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;

  scene = new T.Scene();
  scene.background = new T.Color(0x0c1013);
  scene.fog = new T.Fog(0x0c1013, 5.5, 12);
  camera = new T.PerspectiveCamera(38, 1, 0.1, 60);

  initMaterials();

  scene.add(new T.HemisphereLight(0x9fb4c4, 0x1a1f24, 0.40));
  key = new T.DirectionalLight(0xfff1e0, 1.15);
  key.position.set(1.9,2.6,2.4); key.castShadow = true;
  key.shadow.mapSize.set(1536,1536);
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 9;
  key.shadow.camera.left=-2.4; key.shadow.camera.right=2.4;
  key.shadow.camera.top=2.2; key.shadow.camera.bottom=-2.2;
  key.shadow.bias = -0.0012; scene.add(key);
  const fill = new T.DirectionalLight(0x7fa6c8, 0.30); fill.position.set(-2.3,1.0,1.6); scene.add(fill);
  const rim  = new T.DirectionalLight(0xffd7a8, 0.25); rim.position.set(0,0.6,-2.4); scene.add(rim);

  world = new T.Group(); scene.add(world);
  wireGroup = new T.Group(); world.add(wireGroup);
  buildRoom();
  initPointer();
  return {scene, world, camera, renderer};
}

function buildRoom(){
  const g = new T.Group();
  const bench = shade(box(3.6,0.09,1.6, M.bench)); bench.position.set(0,-0.94,0.48); g.add(bench);
  const lip = box(3.6,0.035,0.04, M.benchEdge); lip.position.set(0,-0.88,1.27); g.add(lip);
  for(const sx of [-1.5,1.5]){
    const leg = shade(box(0.07,0.9,0.07, M.benchEdge)); leg.position.set(sx,-1.40,1.10); g.add(leg);
  }
  const back = shade(box(2.30,1.52,0.05, M.panelEdge)); back.position.set(0,-0.02,-0.07); g.add(back);
  const plate = shade(box(2.16,1.38,0.03, M.panel)); plate.position.set(0,-0.02,-0.035); g.add(plate);
  const duct = (w,h,x,y)=>{
    const d = shade(box(w,h,0.055, M.plasticLt)); d.position.set(x,y,0.03);
    const fm = new T.MeshStandardMaterial({color:0x99958a, roughness:0.85});
    const n = Math.round((w>h?w:h)/0.05);
    for(let i=0;i<n;i++){
      const f = box(w>h?0.014:w*0.7, w>h?h*0.7:0.014, 0.005, fm);
      if(w>h) f.position.set(-w/2+0.03+i*0.05,0,0.031); else f.position.set(0,-h/2+0.03+i*0.05,0.031);
      d.add(f);
    }
    g.add(d);
  };
  duct(0.10,1.24,-1.00,-0.02);
  duct(1.94,0.10,0.08,-0.62);
  const eb = shade(box(0.36,0.035,0.03, new T.MeshStandardMaterial({color:0x9aa05a, roughness:0.4, metalness:0.7})));
  eb.position.set(0.72,-0.62,0.06); g.add(eb);
  const ebl = makeLabel('PE', {h:0.032, color:'#d6e07a'}); ebl.position.set(0.72,-0.56,0.07); g.add(ebl);
  scene.add(g);
}

/* nameplate strip that changes per experiment */
let namePlate = null;
function setNameplate(text){
  if(namePlate){ scene.remove(namePlate); namePlate = null; }
  const g = new T.Group();
  const np = shade(box(0.86,0.085,0.008, M.plasticBlk)); np.position.set(0,0.64,0.0); g.add(np);
  const t = makeLabel(text, {h:0.034, color:'#dde2e6', ls:1.4}); t.position.set(0,0.64,0.007); g.add(t);
  scene.add(g); namePlate = g;
}

function dinRail(x,y,w,parent){
  const g = new T.Group();
  g.add(shade(box(w,0.055,0.012, M.din)));
  for(const sy of [0.0275,-0.0275]){
    const l = shade(box(w,0.012,0.026, M.din)); l.position.set(0,sy,0.019); g.add(l);
  }
  const n = Math.floor(w/0.09);
  for(let i=-n/2;i<n/2;i++){
    const h = new T.Mesh(new T.CircleGeometry(0.008,12), M.plasticBlk);
    h.position.set(i*0.09,0,0.007); g.add(h);
  }
  g.position.set(x,y,-0.005); parent.add(g);
  return g;
}

/* ============================================================================
   EXPERIMENT LOAD / UNLOAD
   ========================================================================== */
let panelGroup = null;
function unload(){
  clearWires();
  if(panelGroup){ world.remove(panelGroup); panelGroup = null; }
  sim.comps = {}; sim.compList = []; sim.terminals = {}; sim.termList = [];
  sim.pickables = sim.pickables.filter(o=>o.userData && o.userData.kind==='wire');
  sim.pickables.length = 0;
  sim.selTerm = null; sim.selWire = null; sim.fault = ''; sim.uf = null;
}

function load(spec){
  unload();
  sim.spec = spec;
  panelGroup = new T.Group(); world.add(panelGroup);
  (spec.rails.din||[]).forEach(r=>dinRail(r[0],r[1],r[2],panelGroup));
  setNameplate(spec.plate || spec.title.toUpperCase());

  spec.parts.forEach(inst=>{
    const def = window.PARTS[inst.type];
    if(!def){ console.warn('unknown part', inst.type); return; }
    const c = {id:inst.id, type:inst.type, def, inst,
               st:{energised:false, elapsed:0, tripped:false, pressed:false,
                   present:false, on:true, phaseOut:[true,true,true], rpm:0, dir:0}};
    const built = def.build(inst, {addTerminal, M, makeLabel, box, cyl, shade, ledMat, T, panelGroup,
                                   pickable:(o)=>{ sim.pickables.push(o); return o; },
                                   at:(o,x,y,z)=>{ o.position.set(x,y,z); return o; }});
    c.group = built.group; c.anim = built.anim || null; c.parts = built;
    c.links = ()=> def.links ? def.links(c) : [];
    panelGroup.add(built.group);
    sim.comps[inst.id] = c; sim.compList.push(c);
  });

  world.updateMatrixWorld(true);
  sim.termList.forEach(t=>t.group.getWorldPosition(t.world));
  // phase tagging for wire colours
  sim.termList.forEach(t=>{ const c = sim.comps[t.comp]; if(c && c.def.phaseOf) t.phase = c.def.phaseOf(t.name); });

  camTarget.set(spec.camera.target[0], spec.camera.target[1], spec.camera.target[2]);
  cam.dist = spec.camera.dist; cam.az = 0.24; cam.el = 0.26;
  applyCamera();
  solve();
}

/* ============================================================================
   POINTER INPUT
   ========================================================================== */
const ray = new T.Raycaster(), ndc = new T.Vector2(), dragPlane = new T.Plane();
let preview, previewGeo;
const pointers = new Map();
let orbiting=false, lastX=0, lastY=0, moved=0, pinch=0;
const listeners = {connect:[], wireRemoved:[], buttonDown:[], buttonUp:[], action:[], select:[]};
function on(ev, fn){ (listeners[ev]||[]).push(fn); }
function emit(ev, ...a){ (listeners[ev]||[]).forEach(f=>f(...a)); }

function initPointer(){
  previewGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]);
  preview = new T.Line(previewGeo, new T.LineBasicMaterial({color:0xe07b39, transparent:true, opacity:0.95, depthTest:false}));
  preview.visible = false; preview.renderOrder = 6; scene.add(preview);

  const setNdc = e=>{
    const r = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX-r.left)/r.width)*2-1;
    ndc.y = -((e.clientY-r.top)/r.height)*2+1;
  };

  canvas.addEventListener('pointerdown', e=>{
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    emit('action','gesture');
    if(pointers.size===2){ const p=[...pointers.values()];
      pinch = Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y); orbiting=false; return; }
    setNdc(e); moved=0; lastX=e.clientX; lastY=e.clientY;
    const hit = pick();
    if(hit && hit.kind==='terminal'){
      if(sim.selTerm && sim.selTerm!==hit.id){ emit('connect', sim.selTerm, hit.id); clearSelection(); }
      else selectTerminal(hit.id);
      return;
    }
    if(hit && hit.kind==='wire'){
      if(sim.selWire===hit.wire){ emit('wireRemoved', hit.wire); removeWire(hit.wire); sim.selWire=null; }
      else { sim.selWire = hit.wire; emit('action','wireArmed'); }
      return;
    }
    if(hit && hit.kind==='control'){ emit('buttonDown', hit.comp, hit.ctl); return; }
    clearSelection(); sim.selWire=null; orbiting=true;
  });

  canvas.addEventListener('pointermove', e=>{
    if(pointers.has(e.pointerId)) pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){
      const p=[...pointers.values()], d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      if(pinch){ cam.dist *= pinch/d; applyCamera(); } pinch=d; return;
    }
    setNdc(e);
    moved += Math.abs(e.clientX-lastX)+Math.abs(e.clientY-lastY);
    if(orbiting){ cam.az -= (e.clientX-lastX)*0.005; cam.el += (e.clientY-lastY)*0.004; applyCamera(); flyTo=null; }
    else if(sim.selTerm) updatePreview();
    else {
      const h = pick();
      const id = (h && h.kind==='terminal') ? h.id : null;
      if(id !== sim.hoverTerm){ sim.hoverTerm = id; emit('select', id); }
      canvas.style.cursor = h ? 'pointer' : 'grab';
    }
    lastX=e.clientX; lastY=e.clientY;
  });

  const end = e=>{
    pointers.delete(e.pointerId); if(pointers.size<2) pinch=0;
    emit('buttonUp');
    if(orbiting){ orbiting=false; return; }
    if(sim.selTerm && moved>12){
      setNdc(e); const hit = pick();
      if(hit && hit.kind==='terminal' && hit.id!==sim.selTerm) emit('connect', sim.selTerm, hit.id);
      clearSelection();
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', e=>{ e.preventDefault(); cam.dist *= (1+Math.sign(e.deltaY)*0.09); applyCamera(); flyTo=null; }, {passive:false});
  canvas.addEventListener('contextmenu', e=>e.preventDefault());
}

function pick(){
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(sim.pickables, false);
  for(const h of hits){
    const u = h.object.userData; if(!u||!u.kind) continue;
    let p = h.object, vis = true;
    while(p){ if(p.visible===false){ vis=false; break; } p = p.parent; }
    if(!vis) continue;
    return Object.assign({object:h.object, point:h.point}, u);
  }
  return null;
}
function clearSelection(){ sim.selTerm=null; preview.visible=false; }
function selectTerminal(id){
  sim.selTerm = id;
  const p = sim.terminals[id].world;
  preview.visible = true;
  const a = previewGeo.attributes.position.array;
  a[0]=p.x; a[1]=p.y; a[2]=p.z+0.02; a[3]=a[0]; a[4]=a[1]; a[5]=a[2];
  previewGeo.attributes.position.needsUpdate = true;
  dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new T.Vector3()).negate(), p);
  emit('action','select');
}
function updatePreview(){
  const hit = new T.Vector3();
  ray.setFromCamera(ndc, camera);
  if(ray.ray.intersectPlane(dragPlane, hit)){
    const a = previewGeo.attributes.position.array;
    a[3]=hit.x; a[4]=hit.y; a[5]=hit.z;
    previewGeo.attributes.position.needsUpdate = true;
  }
}

/* ---------- camera fly-to (used by the terminal finder) ----------------- */
function focusTerminal(id, opt){
  const t = sim.terminals[id]; if(!t) return;
  t.hint = performance.now();
  flyTo = {target:t.world.clone(), dist:(opt&&opt.dist)||0.95, t:0};
}
function focusComponent(compId){
  const ts = sim.termList.filter(t=>t.comp===compId);
  if(!ts.length) return;
  const c = new T.Vector3();
  ts.forEach(t=>c.add(t.world)); c.multiplyScalar(1/ts.length);
  ts.forEach(t=>t.hint = performance.now());
  flyTo = {target:c, dist:1.35, t:0};
}
function resetView(){
  const s = sim.spec; if(!s) return;
  flyTo = {target:new T.Vector3(s.camera.target[0],s.camera.target[1],s.camera.target[2]), dist:s.camera.dist, t:0};
}

/* ---------- per-frame --------------------------------------------------- */
function updateCameraFly(dt){
  if(!flyTo) return;
  flyTo.t = Math.min(1, flyTo.t + dt*2.2);
  const k = 1-Math.pow(1-flyTo.t, 3);
  camTarget.lerp(flyTo.target, k*0.22);
  cam.dist += (flyTo.dist - cam.dist)*k*0.22;
  applyCamera();
  if(flyTo.t>=1 && camTarget.distanceTo(flyTo.target)<0.004) flyTo = null;
}

function setLabelMode(m){
  sim.labelMode = m;
  sim.termList.forEach(t=>{
    t.small.visible = (m===1);
    t.big.visible   = (m===2);
  });
}

function updateTerminalRings(now){
  const pulse = 0.5+0.5*Math.sin(now*0.006);
  const sel = sim.selTerm ? sim.terminals[sim.selTerm] : null;
  for(const t of sim.termList){
    let o = 0, col = 0xe07b39;
    if(sel){
      if(t.id===sim.selTerm) o = 0.95;
      else if(compatible(sel,t)) o = 0.16+0.14*pulse;
    }
    if(sim.hoverTerm===t.id) o = Math.max(o, 0.75);
    if(t.hint && now-t.hint < 7000){ o = Math.max(o, 0.35+0.55*pulse); col = 0x45c16a; }
    t.ring.material.opacity = o;
    t.ring.material.color.setHex(col);
  }
  for(const w of sim.wires){
    if(!w.ok) w.mesh.material.emissive.setRGB(0.30+0.22*pulse,0,0.16+0.12*pulse);
    else if(sim.selWire===w) w.mesh.material.emissive.setRGB(0.22*pulse,0.16*pulse,0.05);
    else w.mesh.material.emissive.setRGB(0,0,0);
  }
}
function compatible(a,b){
  if(a.comp===b.comp) return false;
  if(a.cls==='neutral'||b.cls==='neutral') return true;
  return a.cls===b.cls;
}

function render(){ renderer.render(scene, camera); }
function resize(w,h,mobile){
  renderer.setSize(w,h,false);
  camera.aspect = w/h; camera.updateProjectionMatrix();
  if(sim.spec){ cam.dist = sim.spec.camera.dist * (mobile?1.3:1); applyCamera(); }
}

return {
  init, load, unload, render, resize, on, emit,
  sim, M, makeLabel, box, cyl, shade, ledMat, addTerminal, dinRail,
  addWire, removeWire, clearWires, hasWire, pairKey,
  solve, motorDirection, phaseLive, buildUF,
  focusTerminal, focusComponent, resetView, updateCameraFly,
  updateTerminalRings, setLabelMode, applyCamera, cam, camTarget,
  clearSelection, WIRE_COLOR
};
})();
