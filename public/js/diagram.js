/* ============================================================================
   COEM Lab Simulator — IEC circuit diagram renderer
   A small symbol library plus a vertical-branch composer. Power circuit on the
   left, control circuit on the right, terminal numbers printed against every
   symbol so the drawing and the 3D panel read as the same circuit.
   ========================================================================== */
window.DIAG = (function(){
"use strict";

const INK='var(--dg-ink)', DIM='var(--dg-dim)', HOT='var(--dg-hot)', ACC='var(--dg-acc)';
const SW=2;

/* ---------- primitives -------------------------------------------------- */
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const line = (x1,y1,x2,y2,o={}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c||INK}" stroke-width="${o.w||SW}" stroke-linecap="round"${o.d?` stroke-dasharray="${o.d}"`:''}/>`;
const rect = (x,y,w,h,o={}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.fill||'none'}" stroke="${o.c||INK}" stroke-width="${o.w||SW}" rx="${o.r||0}"${o.d?` stroke-dasharray="${o.d}"`:''}/>`;
const circ = (x,y,r,o={}) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.fill||'none'}" stroke="${o.c||INK}" stroke-width="${o.w||SW}"/>`;
const dot = (x,y,o={}) => `<circle cx="${x}" cy="${y}" r="4" fill="${o.c||INK}"/>`;
const path = (d,o={}) =>
  `<path d="${d}" fill="${o.fill||'none'}" stroke="${o.c||INK}" stroke-width="${o.w||SW}" stroke-linecap="round" stroke-linejoin="round"/>`;
const txt = (x,y,s,o={}) =>
  `<text x="${x}" y="${y}" fill="${o.c||INK}" font-size="${o.s||13}" font-family="${o.f||'IBM Plex Mono, monospace'}" text-anchor="${o.a||'start'}" letter-spacing="${o.ls||0}"${o.w?` font-weight="${o.w}"`:''}>${esc(s)}</text>`;

/* ---------- contact symbols (drawn vertically, current flows down) ------ */
/* every contact occupies 56 px of height, hinge on the left at x */
const CH = 56;
function contactNO(x,y){
  return line(x,y,x,y+16) + line(x,y+40,x,y+56) +
         line(x,y+40,x+16,y+18) + dot(x,y+16) + dot(x,y+40);
}
function contactNC(x,y){
  return line(x,y,x,y+16) + line(x,y+40,x,y+56) +
         line(x,y+40,x+16,y+18) + line(x+16,y+18,x+16,y+10) +
         line(x+9,y+10,x+23,y+10) + dot(x,y+16) + dot(x,y+40);
}
function pushHead(x,y,nc){
  /* the operator's button: stem and bar sitting on the moving blade */
  const bx = x+16, by = nc ? y+10 : y+18;
  return line(bx,by,bx+16,by) + rect(bx+16,by-7,7,14,{fill:INK,c:INK,r:2});
}
function mushroomHead(x,y){
  const bx=x+16, by=y+10;
  return line(bx,by,bx+14,by) + path(`M${bx+14} ${by-11} a11 11 0 0 1 0 22`,{w:SW});
}
function delayHead(x,y,onDelay){
  /* the parachute: on-delay opens/closes late on pick-up */
  const bx = x+16, by = y+22;
  return line(bx,by,bx+14,by) +
         path(onDelay ? `M${bx+7} ${by+9} a9 9 0 0 1 14 0 l0 0` : `M${bx+7} ${by-9} a9 9 0 0 0 14 0`,{w:SW}) +
         line(bx+14,by-9,bx+14,by+9,{w:1.4,c:DIM});
}
function arcHead(x,y){                        /* contactor main pole crescent */
  return path(`M${x+9} ${y+34} a9 9 0 0 0 14 -4`,{w:SW});
}
function coilBox(x,y,label){
  return rect(x-24,y+14,48,28,{r:2}) + line(x,y,x,y+14) + line(x,y+42,x,y+56) +
         txt(x,y+33,label,{a:'middle',s:13,w:600});
}
function coilTimerBox(x,y,label){
  return rect(x-26,y+12,52,32,{r:2}) +
         line(x-26,y+12,x+26,y+44,{w:1.4,c:DIM}) +
         line(x,y,x,y+12) + line(x,y+44,x,y+56) +
         txt(x,y+32,label,{a:'middle',s:12,w:600});
}
function lampSym(x,y,label,col){
  return circ(x,y+28,14,{c:col||INK}) +
         line(x-10,y+18,x+10,y+38,{c:col||INK}) + line(x+10,y+18,x-10,y+38,{c:col||INK}) +
         line(x,y,x,y+14) + line(x,y+42,x,y+56);
}

/* ---------- composer ---------------------------------------------------- */
/* items: {t, label, sub}  t = no | nc | pbno | pbnc | pbmush | tno | tnc |
                               coil | tcoil | lamp | wire | prox               */
function drawItem(it, x, y){
  let s = '';
  switch(it.t){
    case 'no':    s = contactNO(x,y); break;
    case 'nc':    s = contactNC(x,y); break;
    case 'pbno':  s = contactNO(x,y) + pushHead(x,y,false); break;
    case 'pbnc':  s = contactNC(x,y) + pushHead(x,y,true); break;
    case 'pbmush':s = contactNC(x,y) + mushroomHead(x,y); break;
    case 'mno':   s = contactNO(x,y) + arcHead(x,y); break;
    case 'tno':   s = contactNO(x,y) + delayHead(x,y,true); break;
    case 'tnc':   s = contactNC(x,y) + delayHead(x,y,true); break;
    case 'prox':  s = contactNO(x,y) +
                      path(`M${x+16} ${y+18} l14 0`,{w:SW}) +
                      rect(x+30,y+10,16,16,{r:2}) +
                      path(`M${x+30} ${y+10} l16 16 M${x+30} ${y+26} l16 -16`,{w:1.4,c:DIM}); break;
    case 'coil':  s = coilBox(x,y,it.label||''); break;
    case 'tcoil': s = coilTimerBox(x,y,it.label||''); break;
    case 'lamp':  s = lampSym(x,y,it.label,it.c); break;
    case 'wire':  s = line(x,y,x,y+CH); break;
  }
  const isCoil = (it.t==='coil' || it.t==='tcoil');
  const LX = {pbno:50, pbnc:50, pbmush:56, prox:58, tno:46, tnc:46};
  const lx = x + (LX[it.t] || 30);
  if(!isCoil){
    if(it.label) s += txt(lx, y+22, it.label, {s:12, w:600});
    if(it.sub)   s += txt(lx, y+38, it.sub,   {s:11, c:DIM});
  }else{
    if(it.sub) s += txt(x+34, y+34, it.sub, {s:11, c:DIM});
    s += txt(x-32, y+24, 'A1', {s:10, c:DIM, a:'end'});
    s += txt(x-32, y+40, 'A2', {s:10, c:DIM, a:'end'});
  }
  return s;
}
function heightOf(items){
  let h = 0;
  for(const it of items) h += (it.t==='par') ? (Math.max(heightOf(it.a), heightOf(it.b)) + 14) : CH;
  return h;
}
function drawSeries(items, x, y){
  let s = '', cy = y;
  for(const it of items){
    if(it.t==='par'){
      const ha = heightOf(it.a), hb = heightOf(it.b), h = Math.max(ha,hb)+14;
      const x2 = x + (it.gap||96);
      s += line(x, cy, x2, cy);                       // top tie
      s += drawSeries(it.a, x, cy+7).svg;
      s += line(x, cy+7+ha, x, cy+h);
      s += drawSeries(it.b, x2, cy+7).svg;
      s += line(x2, cy, x2, cy+7) + line(x2, cy+7+hb, x2, cy+h);
      s += line(x, cy+h, x2, cy+h);                   // bottom tie
      s += dot(x,cy) + dot(x,cy+h);
      cy += h;
    }else{
      s += drawItem(it, x, cy);
      cy += CH;
    }
  }
  return {svg:s, end:cy};
}

/* one control branch hung between the L rail (yTop) and the N rail (yBot) */
function branch(x, yTop, yBot, items, title){
  const h = heightOf(items);
  const y0 = yTop + Math.max(18, (yBot-yTop-h)/2);
  let s = line(x, yTop, x, y0) + dot(x, yTop);
  s += drawSeries(items, x, y0).svg;
  s += line(x, y0+h, x, yBot) + dot(x, yBot);
  if(title) s += txt(x, yTop-12, title, {a:'middle', s:11, c:ACC, ls:1});
  return s;
}

/* ---------- power circuit building blocks ------------------------------- */
function powerColumn(x0, gap, y0, y1){
  let s = '';
  for(let i=0;i<3;i++) s += line(x0+i*gap, y0, x0+i*gap, y1);
  return s;
}
function pSwitch3(x0, gap, y, label, sub, kind){
  let s = '';
  for(let i=0;i<3;i++){
    const x = x0+i*gap;
    s += line(x,y,x,y+16) + line(x,y+40,x,y+56) + dot(x,y+16) + dot(x,y+40);
    s += line(x,y+40,x+14,y+20);
    if(kind==='contactor') s += arcHead(x,y);
    if(kind==='mcb') s += rect(x+8,y+6,12,12,{r:2});
  }
  s += line(x0+6, y+34, x0+2*gap+6, y+34, {w:1.3, c:DIM, d:'5 5'});   // ganged
  s += txt(x0-18, y+26, label, {a:'end', s:13, w:600});
  if(sub) s += txt(x0-18, y+42, sub, {a:'end', s:11, c:DIM});
  return s;
}
function pHeaters(x0, gap, y, label, sub){
  let s = '';
  for(let i=0;i<3;i++){
    const x = x0+i*gap;
    s += line(x,y,x,y+14) + line(x,y+42,x,y+56);
    s += rect(x-10,y+14,20,28,{r:2});
    s += path(`M${x-6} ${y+21} l6 0 l0 9 l6 0`,{w:1.8});
  }
  s += txt(x0-18, y+26, label, {a:'end', s:13, w:600});
  if(sub) s += txt(x0-18, y+42, sub, {a:'end', s:11, c:DIM});
  return s;
}
function pTermRow(x0, gap, y, names, o={}){
  let s = '';
  const dx = o.dx!==undefined ? o.dx : 24;
  names.forEach((n,i)=> s += txt(x0+i*gap+dx, y, n, {s:11, c:o.c||DIM}));
  return s;
}
function pMotor(x0, gap, y, label, sub, terms){
  let s = '';
  const cx = x0+gap, cy = y+64;
  for(let i=0;i<3;i++){
    const x = x0+i*gap;
    s += line(x, y-20, x, y+8+i*8);
    s += line(x, y+8+i*8, cx + (i-1)*16, y+8+i*8);
    s += line(cx+(i-1)*16, y+8+i*8, cx+(i-1)*16, cy-36);
    s += txt(x+9, y-4, (terms||['U','V','W'])[i], {s:11});
  }
  s += circ(cx, cy, 36);
  s += txt(cx, cy-2, 'M', {a:'middle', s:22, w:700, f:'Saira Condensed, sans-serif'});
  s += txt(cx, cy+18, '3~', {a:'middle', s:13});
  s += txt(cx, cy+62, label, {a:'middle', s:13, w:600});
  if(sub) s += txt(cx, cy+78, sub, {a:'middle', s:11, c:DIM});
  return s;
}

/* ---------- frame ------------------------------------------------------- */
function frame(o){
  const W = o.w||1040, H = o.h||620;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="dgm" role="img" aria-label="${esc(o.aria||'Circuit diagram')}">`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="var(--dg-bg)"/>`;
  s += line(o.split||430, 24, o.split||430, H-24, {c:DIM, w:1.4, d:'6 7'});
  s += txt(28, 40, 'POWER CIRCUIT', {s:13, c:ACC, ls:2, w:600});
  s += txt((o.split||430)+28, 40, 'CONTROL CIRCUIT', {s:13, c:ACC, ls:2, w:600});
  s += o.body;
  s += txt(W-24, H-16, 'SIMULATION ONLY — NOT A WIRING INSTRUCTION', {a:'end', s:11, c:DIM, ls:1});
  s += '</svg>';
  return s;
}

/* supply rails at the top of the power side */
function supplyRails(x0, gap, y, labels){
  let s = '';
  (labels||['L1','L2','L3']).forEach((L,i)=>{
    s += line(x0+i*gap-20, y+i*12, x0+i*gap, y+i*12);
    s += line(x0-20, y, x0-20, y+24, {w:0});   // spacer, no-op
    s += txt(x0+i*gap-26, y+i*12+4, L, {a:'end', s:12, w:600});
  });
  return s;
}

/* control rails */
function railTop(x0,x1,y,label){
  return line(x0,y,x1,y) + txt(x0-10, y+5, label||'L1', {a:'end', s:12, w:600});
}
function railBot(x0,x1,y,label){
  return line(x0,y,x1,y) + txt(x0-10, y+5, label||'N', {a:'end', s:12, w:600});
}

return {line, rect, circ, dot, path, txt, frame, branch, drawSeries, heightOf,
        powerColumn, pSwitch3, pHeaters, pMotor, pTermRow, supplyRails,
        railTop, railBot, CH};
})();
