/* ============================================================================
   COEM Lab Simulator — component library
   Each part supplies:  build(inst, ctx) -> {group, anim?}
                        links(comp)      -> [[termA, termB], ...] conducting now
                        coil             -> {a,b} if it has an operating coil
                        phaseOf(name)    -> 1|2|3 for wire colouring
   Terminal names match the IEC markings printed on real gear, because that is
   what the student has to find on the bench.
   ========================================================================== */
window.PARTS = (function(){
"use strict";
const T = window.THREE;

/* place a mesh: Object3D.position is read-only in three r128, so never assign to it */
function at(o,x,y,z){ o.position.set(x,y,z); return o; }

const PH_MAIN = n => ({'1':1,'2':1,'3':2,'4':2,'5':3,'6':3}[n] || 0);

/* ---------------------------------------------------------------- SUPPLY */
const supply3 = {
  coil:null,
  phaseOf:n=>({'L1':1,'L2':2,'L3':3}[n]||0),
  build(inst, c){
    const {M, box, shade, addTerminal, makeLabel} = c;
    const g = new T.Group(); g.position.set(inst.x, inst.y, 0);
    const ways = inst.ways || ['L1','L2','L3','N'];
    const w = ways.length*0.082 + 0.05;
    const base = shade(box(w,0.21,0.10, M.plasticDk)); base.position.z = 0.05; g.add(base);
    const cap = shade(box(w,0.035,0.104, new T.MeshStandardMaterial({color:0x1a1e22, roughness:0.5})));
    cap.position.set(0,0.087,0.052); g.add(cap);
    const title = makeLabel(inst.title||'INCOMING SUPPLY — SIMULATED 415 V 3~ 50 Hz', {h:0.030, color:'#22272b', ls:1});
    title.position.set(0,0.134,0.06); g.add(title);
    const sub = makeLabel(inst.sub||'virtual source · no live voltage anywhere on this bench', {h:0.022, color:'#414a51', mono:true});
    sub.position.set(0,0.102,0.055); g.add(sub);
    const COL = {L1:'#8a5a34', L2:'#26292d', L3:'#8d949b', N:'#3f8fd0', L:'#8a5a34'};
    const lamps = {};
    ways.forEach((wy,i)=>{
      const px = -w/2 + 0.05 + i*0.082;
      const strip = shade(box(0.066,0.16,0.014,
        new T.MeshStandardMaterial({color:new T.Color(COL[wy]||'#888'), roughness:0.5})));
      strip.position.set(px,-0.014,0.101); g.add(strip);
      addTerminal(g, inst.id, wy, px, -0.014, 0.108,
        {cls: wy==='N'?'neutral':'power', labelPos:'below', compLabel:inst.tag||'Supply',
         desc:(wy==='N'?'Neutral':'Line '+wy.slice(1))+' of the simulated source'});
      if(wy!=='N'){
        const lm = c.ledMat(0x2b3036);
        const l = c.cyl(0.014,0.014,0.01, lm, 16);
        l.rotation.x = Math.PI/2; l.position.set(px, 0.086, 0.058); g.add(l);
        lamps[wy] = lm;
      }
    });
    return {group:g, lamps, ways};
  },
  links(c){
    const out = [], ways = c.parts.ways;
    ways.forEach((wy,i)=>{
      if(wy==='N'){ out.push(['SRCN','N']); return; }
      const idx = (wy==='L')?0:(parseInt(wy.slice(1),10)-1);
      if(c.st.phaseOut[idx]!==false) out.push(['SRC'+(idx+1), wy]);
    });
    return out;
  },
  anim(c){
    const l = c.parts.lamps;
    Object.keys(l).forEach(k=>{
      const idx = (k==='L')?0:(parseInt(k.slice(1),10)-1);
      const on = c.st.phaseOut[idx]!==false;
      l[k].color.setHex(on?0x46d07a:0x2b3036);
      l[k].emissive.setRGB(on?0.10:0, on?0.55:0, on?0.22:0);
    });
  }
};

/* ------------------------------------------------------------------- MCB */
const mcb3 = {
  coil:null, phaseOf:PH_MAIN,
  build(inst, c){
    const {M, box, shade, addTerminal, makeLabel} = c;
    const g = new T.Group(); g.position.set(inst.x, inst.y, 0);
    const body = shade(box(0.22,0.34,0.15, M.plasticLt)); body.position.z = 0.085; g.add(body);
    const front = shade(box(0.225,0.13,0.03, M.plasticDk)); front.position.set(0,0,0.163); g.add(front);
    const handle = shade(box(0.05,0.075,0.045, M.plasticBlk));
    handle.position.set(0,0.018,0.185); handle.rotation.x = -0.22; g.add(handle);
    handle.userData = {kind:'control', comp:inst.id, ctl:'toggle'}; c.pickable(handle);
    g.add(at(makeLabel('I',{h:0.030,color:'#f5f7f8'}), 0.056, 0.032, 0.182));
    g.add(at(makeLabel('O',{h:0.030,color:'#a5b0b8'}), 0.056,-0.030, 0.182));
    const nm = makeLabel((inst.tag||'Q1')+'  MCB  16 A  C', {h:0.024, color:'#ccd3d8', mono:true});
    nm.position.set(0,-0.052,0.161); g.add(nm);
    ['1','3','5'].forEach((t,i)=>{
      addTerminal(g, inst.id, t, -0.068+i*0.068, 0.145, 0.09,
        {cls:'power', labelPos:'above', compLabel:inst.tag||'MCB', desc:'Line in, pole '+(i+1)});
    });
    ['2','4','6'].forEach((t,i)=>{
      addTerminal(g, inst.id, t, -0.068+i*0.068, -0.145, 0.09,
        {cls:'power', labelPos:'below', compLabel:inst.tag||'MCB', desc:'Line out, pole '+(i+1)});
    });
    return {group:g, handle};
  },
  links(c){ return c.st.on ? [['1','2'],['3','4'],['5','6']] : []; },
  anim(c){ c.parts.handle.rotation.x = c.st.on ? -0.22 : 0.22; }
};

/* ------------------------------------------------------------- CONTACTOR */
const contactor3p = {
  coil:{a:'A1', b:'A2'}, phaseOf:PH_MAIN,
  build(inst, c){
    const {M, box, cyl, shade, addTerminal, makeLabel, ledMat} = c;
    const g = new T.Group(); g.position.set(inst.x, inst.y, 0);
    const aux = inst.aux || [{k:'NO', a:'13', b:'14'}];
    const W = 0.46, H = 0.42, D = 0.20, FZ = D+0.002;
    const winY = 0.02, winH = 0.14, winW = 0.36;

    const core = shade(box(W,H,D-0.06, M.plasticDk)); core.position.z = (D-0.06)/2; g.add(core);
    const topH = H/2-(winY+winH/2), botH = (winY-winH/2)+H/2, sideW = (W-winW)/2;
    const tb = shade(box(W,topH,0.06,M.plasticDk)); tb.position.set(0,(winY+winH/2+H/2)/2, D-0.03); g.add(tb);
    const bb = shade(box(W,botH,0.06,M.plasticDk)); bb.position.set(0,((winY-winH/2)-H/2)/2, D-0.03); g.add(bb);
    for(const sx of [-1,1]){
      const sb = shade(box(sideW,winH,0.06,M.plasticDk));
      sb.position.set(sx*(winW+sideW)/2, winY, D-0.03); g.add(sb);
    }
    const glass = new T.Mesh(new T.PlaneGeometry(winW,winH), M.glass);
    glass.position.set(0,winY,D+0.0012); g.add(glass);

    const inner = new T.Group(); inner.position.set(0,winY,0); g.add(inner);
    const bw = box(winW,winH,0.006, new T.MeshStandardMaterial({color:0x222a31, roughness:0.9}));
    bw.position.z = D-0.058; inner.add(bw);
    const IZ = D-0.035;
    const armature = new T.Group(); inner.add(armature);

    const mainX = [-0.10,-0.035,0.03];
    const auxX  = [0.095, 0.16];
    const cols = [];
    mainX.forEach(x=>cols.push({x, k:'NO', main:true}));
    aux.forEach((a,i)=>cols.push({x:auxX[i], k:a.k, main:false}));
    cols.forEach(col=>{
      for(const sy of [0.045,-0.045]){
        const fx = box(0.030,0.030,0.020, M.copper); fx.position.set(col.x,sy,IZ); inner.add(fx);
      }
      const br = box(0.036,0.062,0.024, col.main?M.copper:M.brass);
      br.position.set(col.x, col.k==='NC' ? -0.030 : 0, IZ+0.004);
      armature.add(br);
    });
    const tie = box(W*0.62,0.011,0.018, M.steel); tie.position.set(0.0,0,IZ+0.004); armature.add(tie);

    const coilBlk = shade(box(W*0.55,0.10,0.08, M.coil)); coilBlk.position.set(0,-0.13,0.07); g.add(coilBlk);

    const ledM = ledMat(0x2b3036);
    const ring = cyl(0.030,0.030,0.010, M.plasticBlk, 20); ring.position.set(0.175,H/2,D*0.5); g.add(ring);
    const led = new T.Mesh(new T.SphereGeometry(0.023,18,14,0,Math.PI*2,0,Math.PI/2), ledM);
    led.rotation.x = -Math.PI/2; led.position.set(0.175,H/2+0.004,D*0.5); g.add(led);
    const ll = makeLabel('COIL',{h:0.024,color:'#c3ccd2',mono:true});
    ll.rotation.x = -Math.PI/2; ll.position.set(0.175,H/2+0.002,D*0.5+0.052); g.add(ll);

    const nm = makeLabel(inst.tag||'KM1',{h:0.040,color:'#f4f6f8',ls:2});
    nm.position.set(-W/2+0.065,0.192,FZ); g.add(nm);
    const nm2 = makeLabel(inst.sub||'CONTACTOR 9 A AC-3',{h:0.019,color:'#9fabb3',mono:true});
    nm2.position.set(0.08,0.192,FZ); g.add(nm2);
    const cl = makeLabel('COIL A1/A2 · 230 V ~ · SIMULATED',{h:0.018,color:'#aeb9c0',mono:true});
    cl.position.set(0,-0.192,FZ); g.add(cl);

    const stOff = makeLabel('DE-ENERGISED',{h:0.021,color:'#8b969d',mono:true}); stOff.position.set(0,-0.068,FZ); g.add(stOff);
    const stOn  = makeLabel('ENERGISED',{h:0.021,color:'#5fe08c',mono:true});    stOn.position.set(0,-0.068,FZ); stOn.visible=false; g.add(stOn);

    const TOPY = 0.155, BOTY = -0.14;
    ['1','3','5'].forEach((t,i)=>addTerminal(g, inst.id, t, mainX[i], TOPY, FZ,
      {cls:'power', labelPos:'below', compLabel:inst.tag||'KM', desc:'Main pole '+(i+1)+' in'}));
    ['2','4','6'].forEach((t,i)=>addTerminal(g, inst.id, t, mainX[i], BOTY, FZ,
      {cls:'power', labelPos:'above', compLabel:inst.tag||'KM', desc:'Main pole '+(i+1)+' out'}));
    aux.forEach((a,i)=>{
      addTerminal(g, inst.id, a.a, auxX[i], TOPY, FZ,
        {cls:'control', labelPos:'below', compLabel:inst.tag||'KM', desc:'Auxiliary '+a.k+' contact'});
      addTerminal(g, inst.id, a.b, auxX[i], BOTY, FZ,
        {cls:'control', labelPos:'above', compLabel:inst.tag||'KM', desc:'Auxiliary '+a.k+' contact'});
      const t = makeLabel(a.k,{h:0.017,color:a.k==='NO'?'#e09a63':'#e08585',mono:true});
      t.position.set(auxX[i],-0.172,FZ); g.add(t);
    });
    addTerminal(g, inst.id, 'A1', -0.19, TOPY, FZ,
      {cls:'control', labelPos:'below', compLabel:inst.tag||'KM', lc:'#ffd7b0', desc:'Coil terminal A1'});
    addTerminal(g, inst.id, 'A2', -0.19, BOTY, FZ,
      {cls:'control', labelPos:'above', compLabel:inst.tag||'KM', lc:'#ffd7b0', desc:'Coil terminal A2'});

    return {group:g, armature, led:ledM, coilBlk, stOn, stOff, travel:0};
  },
  links(c){
    const out = [];
    if(c.st.energised){ out.push(['1','2'],['3','4'],['5','6']); }
    (c.inst.aux||[{k:'NO',a:'13',b:'14'}]).forEach(a=>{
      if(a.k==='NO' ? c.st.energised : !c.st.energised) out.push([a.a,a.b]);
    });
    return out;
  },
  anim(c, dt){
    const p = c.parts;
    p.travel += ((c.st.energised?-0.030:0) - p.travel) * Math.min(1, dt*22);
    p.armature.position.y = 0.030 + p.travel;
    const gl = c.st.energised ? 1 : 0;
    p.led.color.setHex(gl?0x46d07a:0x2b3036);
    p.led.emissive.setRGB(0.10*gl, 0.62*gl, 0.26*gl);
    p.coilBlk.material.emissive.setRGB(0.16*gl,0.07*gl,0);
    p.stOn.visible = !!gl; p.stOff.visible = !gl;
  }
};

/* ------------------------------------------------------- OVERLOAD RELAY */
const olr = {
  coil:null, phaseOf:PH_MAIN,
  build(inst, c){
    const {M, box, cyl, shade, addTerminal, makeLabel, ledMat} = c;
    const g = new T.Group(); g.position.set(inst.x, inst.y, 0);
    const W=0.40,H=0.25,D=0.16, FZ=D+0.002;
    const body = shade(box(W,H,D,M.plasticMd)); body.position.z = D/2; g.add(body);
    const face = shade(box(W*0.95,H*0.5,0.02,M.plasticDk)); face.position.set(0,-0.012,FZ); g.add(face);
    const nm = makeLabel((inst.tag||'F2')+'  THERMAL OVERLOAD RELAY',{h:0.024,color:'#e2e7ea',mono:true});
    nm.position.set(0,0.094,FZ); g.add(nm);
    const dial = cyl(0.032,0.032,0.012,M.plasticLt,22); dial.rotation.x=Math.PI/2;
    dial.position.set(-0.125,-0.014,FZ+0.011); shade(dial); g.add(dial);
    const ptr = box(0.006,0.03,0.004,M.red); ptr.position.set(-0.125,0.004,FZ+0.018); g.add(ptr);
    const dl = makeLabel(inst.range||'5.5 – 8 A',{h:0.019,color:'#aab4bb',mono:true});
    dl.position.set(-0.125,-0.062,FZ+0.011); g.add(dl);
    const flagM = ledMat(0x2f353b);
    const flag = box(0.05,0.026,0.008,flagM); flag.position.set(-0.02,-0.014,FZ+0.013); g.add(flag);
    g.add(at(makeLabel('TRIP',{h:0.019,color:'#9fa9b0',mono:true}), -0.02,-0.052,FZ+0.011));
    const rb = cyl(0.021,0.021,0.022,M.plasticLt,20); rb.rotation.x=Math.PI/2;
    rb.position.set(0.07,-0.014,FZ+0.012); shade(rb);
    rb.userData = {kind:'control', comp:inst.id, ctl:'reset'}; c.pickable(rb); g.add(rb);
    g.add(at(makeLabel('RESET',{h:0.019,color:'#aab4bb',mono:true}), 0.07,-0.052,FZ+0.011));

    const mainX = [-0.125,-0.06,0.005];
    ['1','3','5'].forEach((t,i)=>addTerminal(g, inst.id, t, mainX[i], H/2-0.028, D*0.72,
      {cls:'power', labelPos:'above', compLabel:inst.tag||'OLR', desc:'Heater element '+(i+1)+' in'}));
    ['2','4','6'].forEach((t,i)=>addTerminal(g, inst.id, t, mainX[i], -H/2+0.028, D*0.72,
      {cls:'power', labelPos:'below', compLabel:inst.tag||'OLR', desc:'Heater element '+(i+1)+' out'}));
    addTerminal(g, inst.id, '95', 0.115, H/2-0.028, D*0.72,
      {cls:'control', labelPos:'above', compLabel:inst.tag||'OLR', desc:'Trip contact, normally closed'});
    addTerminal(g, inst.id, '96', 0.115, -H/2+0.028, D*0.72,
      {cls:'control', labelPos:'below', compLabel:inst.tag||'OLR', desc:'Trip contact, normally closed'});
    if(inst.no){
      addTerminal(g, inst.id, '97', 0.175, H/2-0.028, D*0.72,
        {cls:'control', labelPos:'above', compLabel:inst.tag||'OLR', desc:'Trip contact, normally open'});
      addTerminal(g, inst.id, '98', 0.175, -H/2+0.028, D*0.72,
        {cls:'control', labelPos:'below', compLabel:inst.tag||'OLR', desc:'Trip contact, normally open'});
    }
    return {group:g, flag:flagM};
  },
  links(c){
    const out = [['1','2'],['3','4'],['5','6']];
    if(!c.st.tripped) out.push(['95','96']); else out.push(['97','98']);
    return out;
  },
  anim(c){
    c.parts.flag.color.setHex(c.st.tripped?0xe0524b:0x2f353b);
    c.parts.flag.emissive.setRGB(c.st.tripped?0.72:0,0,0);
  }
};

/* ------------------------------------------------------------ PUSHBUTTON */
const pushbutton = {
  coil:null,
  build(inst, c){
    const {M, box, cyl, shade, addTerminal, makeLabel} = c;
    const g = new T.Group(); g.position.set(inst.x, inst.y, 0);
    const nc = inst.k === 'NC';
    const col = inst.color==='green' ? M.green : inst.color==='amber' ? M.amber : M.red;
    const base = shade(box(0.20,0.20,0.10,M.plasticDk)); base.position.z=0.05; g.add(base);
    const collar = cyl(0.055,0.058,0.03,M.steel,24); collar.rotation.x=Math.PI/2; collar.position.z=0.105; shade(collar); g.add(collar);
    const capM = inst.mushroom
      ? new T.Mesh(new T.CylinderGeometry(0.062,0.05,0.035,26), col)
      : new T.Mesh(new T.CylinderGeometry(0.046,0.046,0.030,26), col);
    capM.rotation.x = Math.PI/2; capM.position.z = 0.128; shade(capM);
    capM.userData = {kind:'control', comp:inst.id, ctl:'press'}; c.pickable(capM); g.add(capM);
    const legend = makeLabel(inst.legend||'START',{h:0.032,color:'#f0f3f5',ls:1.5});
    legend.position.set(0,-0.078,0.101); g.add(legend);
    const tag = makeLabel((inst.tag||inst.id)+' '+(nc?'NC':'NO'),{h:0.024,color:'#9aa5ad',mono:true});
    tag.position.set(0,0.078,0.101); g.add(tag);
    const a = nc?'11':'13', b = nc?'12':'14';
    addTerminal(g, inst.id, a, -0.066,-0.112, 0.04,
      {cls:'control', labelPos:'left', compLabel:inst.legend||inst.id, desc:(nc?'NC':'NO')+' contact'});
    addTerminal(g, inst.id, b,  0.066,-0.112, 0.04,
      {cls:'control', labelPos:'right', compLabel:inst.legend||inst.id, desc:(nc?'NC':'NO')+' contact'});
    return {group:g, cap:capM, rest:0.128};
  },
  links(c){
    const nc = c.inst.k==='NC';
    if(nc) return c.st.pressed ? [] : [['11','12']];
    return c.st.pressed ? [['13','14']] : [];
  },
  anim(c){ c.parts.cap.position.z = c.st.pressed ? c.parts.rest-0.014 : c.parts.rest; }
};

/* ------------------------------------------------------- CONTROL RELAY */
const relay = {
  coil:{a:'A1', b:'A2'},
  build(inst, c){
    const {M, box, cyl, shade, addTerminal, makeLabel, ledMat} = c;
    const g = new T.Group(); g.position.set(inst.x, inst.y, 0);
    const W=0.30,H=0.30,D=0.17,FZ=D+0.002;
    const base = shade(box(W,0.07,D,M.plasticDk)); base.position.set(0,-H/2+0.035,D/2); g.add(base);
    const can = shade(box(W*0.82,H-0.07,D*0.86, M.glass)); can.position.set(0,0.035,D*0.44); g.add(can);
    const canF = shade(box(W*0.82,H-0.07,0.004, M.plasticDk)); canF.position.set(0,0.035,0.004); g.add(canF);
    const arm = new T.Group(); g.add(arm);
    for(let i=0;i<4;i++){
      const x = -0.09+i*0.06;
      const f1 = box(0.022,0.020,0.014,M.copper); f1.position.set(x,0.10,D*0.5); g.add(f1);
      const f2 = box(0.022,0.020,0.014,M.copper); f2.position.set(x,0.02,D*0.5); g.add(f2);
      const br = box(0.028,0.05,0.016,M.brass); br.position.set(x,0.06,D*0.55); arm.add(br);
    }
    const coilM = ledMat(0x6a4a22);
    const cw = cyl(0.036,0.036,0.07,coilM,18); cw.rotation.z=Math.PI/2; cw.position.set(0,-0.07,D*0.5); shade(cw); g.add(cw);
    const nm = makeLabel(inst.tag||'K1',{h:0.036,color:'#f4f6f8',ls:2}); nm.position.set(-W/2+0.05,H/2-0.028,FZ); g.add(nm);
    const nm2 = makeLabel(inst.sub||'CONTROL RELAY 230 V ~',{h:0.017,color:'#9fabb3',mono:true});
    nm2.position.set(0.055,H/2-0.028,FZ); g.add(nm2);

    const contacts = inst.contacts || [{k:'NO',a:'13',b:'14'},{k:'NO',a:'23',b:'24'},{k:'NC',a:'31',b:'32'},{k:'NC',a:'41',b:'42'}];
    const xs = [-0.105,-0.035,0.035,0.105];
    contacts.forEach((ct,i)=>{
      addTerminal(g, inst.id, ct.a, xs[i], H/2+0.055, D*0.62,
        {cls:'control', labelPos:'above', compLabel:inst.tag||inst.id, desc:ct.k+' contact'});
      addTerminal(g, inst.id, ct.b, xs[i], -H/2-0.055, D*0.62,
        {cls:'control', labelPos:'below', compLabel:inst.tag||inst.id, desc:ct.k+' contact'});
      const l = makeLabel(ct.k,{h:0.016,color:ct.k==='NO'?'#e09a63':'#e08585',mono:true});
      l.position.set(xs[i], -H/2-0.004, FZ); g.add(l);
    });
    addTerminal(g, inst.id, 'A1', -0.175, 0.055, D*0.62,
      {cls:'control', labelPos:'left', compLabel:inst.tag||inst.id, lc:'#ffd7b0', desc:'Coil terminal A1'});
    addTerminal(g, inst.id, 'A2', -0.175, -0.055, D*0.62,
      {cls:'control', labelPos:'left', compLabel:inst.tag||inst.id, lc:'#ffd7b0', desc:'Coil terminal A2'});
    return {group:g, arm, coilM, travel:0};
  },
  links(c){
    const cs = c.inst.contacts || [{k:'NO',a:'13',b:'14'},{k:'NO',a:'23',b:'24'},{k:'NC',a:'31',b:'32'},{k:'NC',a:'41',b:'42'}];
    return cs.filter(ct => ct.k==='NO' ? c.st.energised : !c.st.energised).map(ct=>[ct.a,ct.b]);
  },
  anim(c, dt){
    const p = c.parts;
    p.travel += ((c.st.energised?-0.020:0) - p.travel)*Math.min(1, dt*24);
    p.arm.position.y = p.travel;
    const gl = c.st.energised?1:0;
    p.coilM.emissive.setRGB(0.22*gl,0.10*gl,0);
  }
};

/* ------------------------------------------------------- ON-DELAY TIMER */
const timer = {
  coil:{a:'A1', b:'A2'},
  build(inst, c){
    const {M, box, cyl, shade, addTerminal, makeLabel, ledMat} = c;
    const g = new T.Group(); g.position.set(inst.x, inst.y, 0);
    const W=0.30,H=0.30,D=0.17,FZ=D+0.002;
    const body = shade(box(W,H,D,M.plasticDk)); body.position.z=D/2; g.add(body);
    const face = shade(box(W*0.94,H*0.55,0.016,M.plasticBlk)); face.position.set(0,0.012,FZ); g.add(face);
    const dial = cyl(0.055,0.055,0.014,M.plasticLt,28); dial.rotation.x=Math.PI/2;
    dial.position.set(-0.062,0.014,FZ+0.012); shade(dial); g.add(dial);
    const knob = box(0.008,0.05,0.006,M.red); knob.position.set(-0.062,0.036,FZ+0.020); g.add(knob);
    for(let i=0;i<=10;i++){
      const a = (-0.8 + i*0.16)*Math.PI;
      const tk = box(0.003,0.010,0.003,M.plasticBlk);
      tk.position.set(-0.062+Math.sin(a)*0.046, 0.014+Math.cos(a)*0.046, FZ+0.014); g.add(tk);
    }
    const dl = makeLabel('0 – 30 s',{h:0.018,color:'#aab4bb',mono:true}); dl.position.set(-0.062,-0.052,FZ+0.012); g.add(dl);
    const runM = ledMat(0x2b3036);
    const run = cyl(0.013,0.013,0.008,runM,16); run.rotation.x=Math.PI/2; run.position.set(0.02,0.046,FZ+0.010); g.add(run);
    const upM = ledMat(0x2b3036);
    const up = cyl(0.013,0.013,0.008,upM,16); up.rotation.x=Math.PI/2; up.position.set(0.02,0.004,FZ+0.010); g.add(up);
    g.add(at(makeLabel('TIMING',{h:0.016,color:'#9aa5ad',mono:true}), 0.078,0.046,FZ+0.010));
    g.add(at(makeLabel('TIMED OUT',{h:0.016,color:'#9aa5ad',mono:true}), 0.092,0.004,FZ+0.010));
    const nm = makeLabel(inst.tag||'KT',{h:0.034,color:'#f4f6f8',ls:2}); nm.position.set(-W/2+0.045,H/2-0.028,FZ); g.add(nm);
    const nm2 = makeLabel('ON-DELAY TIMER',{h:0.017,color:'#9fabb3',mono:true}); nm2.position.set(0.06,H/2-0.028,FZ); g.add(nm2);
    const setl = makeLabel('SET  '+(inst.preset||5)+' s',{h:0.020,color:'#f0b95f',mono:true});
    setl.position.set(0,-0.118,FZ); g.add(setl);

    addTerminal(g, inst.id, 'A1', -0.105, H/2+0.055, D*0.62,
      {cls:'control', labelPos:'above', compLabel:inst.tag||'KT', lc:'#ffd7b0', desc:'Timer coil A1'});
    addTerminal(g, inst.id, 'A2', -0.105, -H/2-0.055, D*0.62,
      {cls:'control', labelPos:'below', compLabel:inst.tag||'KT', lc:'#ffd7b0', desc:'Timer coil A2'});
    addTerminal(g, inst.id, '55', -0.02, H/2+0.055, D*0.62,
      {cls:'control', labelPos:'above', compLabel:inst.tag||'KT', desc:'Delayed NC contact'});
    addTerminal(g, inst.id, '56', -0.02, -H/2-0.055, D*0.62,
      {cls:'control', labelPos:'below', compLabel:inst.tag||'KT', desc:'Delayed NC contact'});
    addTerminal(g, inst.id, '57', 0.075, H/2+0.055, D*0.62,
      {cls:'control', labelPos:'above', compLabel:inst.tag||'KT', desc:'Delayed NO contact'});
    addTerminal(g, inst.id, '58', 0.075, -H/2-0.055, D*0.62,
      {cls:'control', labelPos:'below', compLabel:inst.tag||'KT', desc:'Delayed NO contact'});
    g.add(at(makeLabel('NC',{h:0.016,color:'#e08585',mono:true}), -0.02,-H/2-0.006,FZ));
    g.add(at(makeLabel('NO',{h:0.016,color:'#e09a63',mono:true}), 0.075,-H/2-0.006,FZ));
    return {group:g, runM, upM, knob};
  },
  links(c){
    const done = c.st.energised && c.st.elapsed >= (c.inst.preset||5);
    return done ? [['57','58']] : [['55','56']];
  },
  anim(c, dt){
    const timing = c.st.energised && c.st.elapsed < (c.inst.preset||5);
    const done = c.st.energised && !timing;
    c.parts.runM.color.setHex(timing?0xefb229:0x2b3036);
    c.parts.runM.emissive.setRGB(timing?0.6:0, timing?0.42:0, 0);
    c.parts.upM.color.setHex(done?0x46d07a:0x2b3036);
    c.parts.upM.emissive.setRGB(0, done?0.6:0, done?0.25:0);
  }
};

/* --------------------------------------------------- PROXIMITY SWITCH */
const proximity = {
  coil:null,
  build(inst, c){
    const {M, box, cyl, shade, addTerminal, makeLabel, ledMat} = c;
    const g = new T.Group(); g.position.set(inst.x, inst.y, inst.z||0);
    const barrel = cyl(0.032,0.032,0.20,M.steel,22);
    barrel.rotation.z = Math.PI/2; shade(barrel); g.add(barrel);
    const nut1 = cyl(0.040,0.040,0.016,M.steel,6); nut1.rotation.z=Math.PI/2; nut1.position.x=-0.02; g.add(nut1);
    const nut2 = cyl(0.040,0.040,0.016,M.steel,6); nut2.rotation.z=Math.PI/2; nut2.position.x= 0.02; g.add(nut2);
    const faceM = new T.MeshStandardMaterial({color:0xd8c48a, roughness:0.6});
    const face = cyl(0.031,0.031,0.012,faceM,22); face.rotation.z=Math.PI/2; face.position.x=0.104; g.add(face);
    const ledM = ledMat(0x2b3036);
    const led = new T.Mesh(new T.SphereGeometry(0.014,14,10), ledM); led.position.set(-0.085,0.028,0); g.add(led);
    const tb = shade(box(0.13,0.11,0.11,M.plasticDk)); tb.position.set(-0.155,0,0); g.add(tb);
    const nm = makeLabel((inst.tag||'S3')+'  INDUCTIVE PROXIMITY SWITCH',{h:0.022,color:'#cfd6db',mono:true});
    nm.position.set(0,0.10,0.02); g.add(nm);
    const nm2 = makeLabel('2-wire · NO · senses metal',{h:0.018,color:'#8f9aa2',mono:true});
    nm2.position.set(0,0.072,0.02); g.add(nm2);
    addTerminal(g, inst.id, '1', -0.155, 0.028, 0.058,
      {cls:'control', labelPos:'left', compLabel:inst.tag||'S3', desc:'Switch contact, closes on metal'});
    addTerminal(g, inst.id, '2', -0.155, -0.028, 0.058,
      {cls:'control', labelPos:'left', compLabel:inst.tag||'S3', desc:'Switch contact, closes on metal'});
    return {group:g, ledM};
  },
  links(c){ return c.st.present ? [['1','2']] : []; },
  anim(c){
    const p = c.st.present?1:0;
    c.parts.ledM.color.setHex(p?0xefb229:0x2b3036);
    c.parts.ledM.emissive.setRGB(0.65*p,0.45*p,0);
  }
};

/* ------------------------------------------- SINGLE-PHASING PREVENTER */
const spp = {
  coil:null,
  build(inst, c){
    const {M, box, cyl, shade, addTerminal, makeLabel, ledMat} = c;
    const g = new T.Group(); g.position.set(inst.x, inst.y, 0);
    const W=0.36,H=0.30,D=0.16,FZ=D+0.002;
    const body = shade(box(W,H,D,M.plasticBlk)); body.position.z=D/2; g.add(body);
    const face = shade(box(W*0.94,H*0.44,0.014,M.plasticDk)); face.position.set(0,-0.01,FZ); g.add(face);
    const nm = makeLabel((inst.tag||'K3')+'  SINGLE-PHASING PREVENTER',{h:0.021,color:'#e2e7ea',mono:true});
    nm.position.set(0,H/2-0.03,FZ); g.add(nm);
    const nm2 = makeLabel('phase-failure & phase-sequence relay',{h:0.016,color:'#8f9aa2',mono:true});
    nm2.position.set(0,H/2-0.058,FZ); g.add(nm2);
    const lamps = [];
    ['R','Y','B'].forEach((p,i)=>{
      const m = ledMat(0x2b3036);
      const l = cyl(0.017,0.017,0.010,m,18); l.rotation.x=Math.PI/2; l.position.set(-0.11+i*0.058,0.006,FZ+0.010); g.add(l);
      g.add(at(makeLabel(p,{h:0.020,color:'#c3ccd2',mono:true}), -0.11+i*0.058,-0.030,FZ+0.010));
      lamps.push(m);
    });
    const hm = ledMat(0x2b3036);
    const h = cyl(0.019,0.019,0.010,hm,18); h.rotation.x=Math.PI/2; h.position.set(0.10,0.006,FZ+0.010); g.add(h);
    g.add(at(makeLabel('HEALTHY',{h:0.017,color:'#c3ccd2',mono:true}), 0.10,-0.030,FZ+0.010));

    ['R','Y','B','N'].forEach((p,i)=>{
      addTerminal(g, inst.id, p, -0.135+i*0.070, H/2+0.055, D*0.62,
        {cls: p==='N'?'neutral':'power', labelPos:'above', compLabel:inst.tag||'SPP',
         desc:'Voltage sensing input '+p});
    });
    [['11','Common of the output changeover contact'],
     ['14','Output contact, closed while the supply is healthy'],
     ['12','Output contact, closed while a phase is missing']].forEach((t,i)=>{
      addTerminal(g, inst.id, t[0], -0.09+i*0.09, -H/2-0.055, D*0.62,
        {cls:'control', labelPos:'below', compLabel:inst.tag||'SPP', desc:t[1]});
    });
    return {group:g, lamps, hm};
  },
  links(c){ return c.st.healthy===false ? [['11','12']] : [['11','14']]; },
  anim(c){
    (c.st.phaseSeen||[true,true,true]).forEach((v,i)=>{
      c.parts.lamps[i].color.setHex(v?0x46d07a:0x2b3036);
      c.parts.lamps[i].emissive.setRGB(0, v?0.55:0, v?0.22:0);
    });
    const ok = c.st.healthy!==false;
    c.parts.hm.color.setHex(ok?0x46d07a:0xe0524b);
    c.parts.hm.emissive.setRGB(ok?0:0.62, ok?0.55:0, ok?0.22:0);
  }
};

/* ----------------------------------------------------------------- MOTOR */
const motor3 = {
  coil:null, phaseOf:n=>({'U':1,'V':2,'W':3}[n]||0),
  build(inst, c){
    const {M, box, cyl, shade, addTerminal, makeLabel} = c;
    const g = new T.Group(); g.position.set(inst.x, inst.y, inst.z||0);
    const R=0.17, L=0.34;
    const shell = cyl(R,R,L,M.motorBody,30); shell.rotation.z=Math.PI/2; shade(shell); g.add(shell);
    for(let i=0;i<14;i++){
      const a = i/14*Math.PI*2;
      const f = box(L*0.92,0.022,0.03,M.motorFin);
      f.position.set(0, Math.sin(a)*(R+0.012), Math.cos(a)*(R+0.012)); f.rotation.x=-a; shade(f); g.add(f);
    }
    const eA = cyl(R*0.92,R*0.92,0.05,M.motorFin,30); eA.rotation.z=Math.PI/2; eA.position.x=L/2+0.02; shade(eA); g.add(eA);
    const eB = eA.clone(); eB.position.x=-L/2-0.02; g.add(eB);
    const rotor = new T.Group(); g.add(rotor);
    const shaft = cyl(0.026,0.026,0.20,M.steel,18); shaft.rotation.z=Math.PI/2; shaft.position.x=L/2+0.12; shade(shaft); rotor.add(shaft);
    const disc = cyl(0.085,0.085,0.022,M.steel,26); disc.rotation.z=Math.PI/2; disc.position.x=L/2+0.19; shade(disc); rotor.add(disc);
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2;
      const s = box(0.024,0.018,0.055,M.plasticBlk);
      s.position.set(L/2+0.20, Math.sin(a)*0.05, Math.cos(a)*0.05); s.rotation.x=-a; rotor.add(s);
    }
    const tb = shade(box(0.19,0.09,0.16,M.plasticBlk)); tb.position.set(0,R+0.04,0); g.add(tb);
    const lid = shade(box(0.195,0.012,0.165,M.plasticDk)); lid.position.set(0,R+0.09,0); g.add(lid);
    (inst.terminals||['U','V','W']).forEach((p,i,arr)=>{
      addTerminal(g, inst.id, p, -0.05+i*0.05, R+0.045, 0.085,
        {cls:'power', labelPos:'above', compLabel:inst.tag||'M1', desc:'Stator winding '+p});
    });
    for(const sx of [-0.12,0.12]){ const f = shade(box(0.07,0.05,0.26,M.motorFin)); f.position.set(sx,-R-0.01,0); g.add(f); }
    const base = shade(box(0.52,0.05,0.34,M.benchEdge)); base.position.set(0,-R-0.055,0); g.add(base);
    const np = shade(box(0.15,0.075,0.006,M.steel)); np.position.set(0,0.02,R+0.001); g.add(np);
    const npt = makeLabel(inst.rating||'3~ 1.5 kW 1440 rpm',{h:0.017,color:'#20262b'}); npt.position.set(0,0.02,R+0.006); g.add(npt);
    const tag = makeLabel((inst.tag||'M1')+'  ·  '+(inst.sub||'3-PHASE CAGE INDUCTION MOTOR'),{h:0.028,color:'#cfd6db',mono:true});
    tag.position.set(0,-R-0.125,0.10); g.add(tag);
    const arrow = makeLabel('▶',{h:0.05,color:'#45c16a'}); arrow.position.set(L/2+0.34,0,0.0); g.add(arrow);
    const arrowR = makeLabel('◀',{h:0.05,color:'#4aa3d8'}); arrowR.position.set(L/2+0.34,0,0.0); arrowR.visible=false; g.add(arrowR);
    arrow.visible = false;
    return {group:g, rotor, arrow, arrowR};
  },
  links(){ return []; },
  anim(c, dt){
    c.parts.rotor.rotation.x += (c.st.rpm/1440)*dt*26*(c.st.dir>=0?1:-1);
    c.parts.arrow.visible  = c.st.rpm>40 && c.st.dir>0;
    c.parts.arrowR.visible = c.st.rpm>40 && c.st.dir<0;
  }
};

/* -------------------------------------------------------------- CONVEYOR */
const conveyor = {
  coil:null,
  build(inst, c){
    const {M, box, cyl, shade, makeLabel} = c;
    const g = new T.Group(); g.position.set(inst.x, inst.y, inst.z||0);
    const L = inst.len||1.05, W = 0.26;
    const frame = shade(box(L,0.04,W, M.benchEdge)); frame.position.y=-0.055; g.add(frame);
    for(const sx of [-L/2+0.06, L/2-0.06]) for(const sz of [-W/2+0.03, W/2-0.03]){
      const leg = shade(box(0.035,0.16,0.035,M.benchEdge)); leg.position.set(sx,-0.135,sz); g.add(leg);
    }
    const rollers = [];
    for(const sx of [-L/2+0.05, L/2-0.05]){
      const r = cyl(0.05,0.05,W,M.steel,20); r.rotation.x=Math.PI/2; r.position.set(sx,0,0); shade(r); g.add(r);
      rollers.push(r);
    }
    const beltM = new T.MeshStandardMaterial({color:0x23282d, roughness:0.95});
    const top = shade(box(L-0.1,0.012,W,beltM)); top.position.y=0.05; g.add(top);
    const bot = shade(box(L-0.1,0.012,W,beltM)); bot.position.y=-0.05; g.add(bot);
    const cleats = [];
    for(let i=0;i<10;i++){
      const cl = box(0.012,0.006,W*0.96, new T.MeshStandardMaterial({color:0x30363c, roughness:0.9}));
      cl.position.set(-L/2+0.06+i*(L-0.12)/10, 0.059, 0); g.add(cl); cleats.push(cl);
    }
    const objM = new T.MeshStandardMaterial({color:0xb0b6bd, roughness:0.35, metalness:0.85});
    const obj = shade(box(0.085,0.085,0.085,objM)); obj.position.set(-L/2+0.12,0.10,0); g.add(obj);
    const tag = makeLabel(inst.tag||'CONVEYOR BELT',{h:0.026,color:'#cfd6db',mono:true});
    tag.position.set(0,-0.235,W/2+0.01); g.add(tag);
    const ol = makeLabel('STEEL BILLET',{h:0.020,color:'#9aa5ad',mono:true});
    ol.position.set(0,0.175,0); g.add(ol);
    return {group:g, rollers, cleats, obj, objLabel:ol, L, pos:0};
  },
  links(){ return []; },
  anim(c, dt){
    const p = c.parts, L = p.L;
    const v = (c.st.speed||0);
    p.pos = (p.pos + v*dt);
    const span = L-0.24;
    let x = -L/2+0.12 + ((p.pos % span)+span) % span;
    p.obj.position.x = x;
    p.objLabel.position.x = x;
    p.obj.rotation.y += v*dt*0.4;
    p.rollers.forEach(r=>r.rotation.z -= v*dt*12);
    p.cleats.forEach((cl,i)=>{
      const step = (L-0.12)/10;
      let cx = -L/2+0.06 + (((i*step + p.pos) % (L-0.12)) + (L-0.12)) % (L-0.12);
      cl.position.x = cx;
    });
    c.st.objX = x;
  }
};

return {supply3, mcb3, contactor3p, olr, pushbutton, relay, timer, proximity, spp, motor3, conveyor};
})();
