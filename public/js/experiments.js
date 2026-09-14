/* ============================================================================
   COEM Lab Simulator — experiment definitions
   Experiments 1–3 are fully playable. 4–10 are listed with their aim so the
   lab index matches the syllabus; they are built in the next stage.
   ========================================================================== */
window.EXPERIMENTS = (function(){
"use strict";
const D = window.DIAG;
const E = (a,b,g)=>({a,b,g});

/* shared bits ------------------------------------------------------------ */
const SAFETY = 'Everything on this bench is simulated. No terminal carries voltage, ' +
               'and nothing here is a procedure for working on real 415 V equipment.';

const powerChain = (km)=>[
  E('SUP.L1','Q1.1','power'), E('SUP.L2','Q1.3','power'), E('SUP.L3','Q1.5','power'),
  E('Q1.2', km+'.1','power'), E('Q1.4', km+'.3','power'), E('Q1.6', km+'.5','power'),
  E(km+'.2','F2.1','power'),  E(km+'.4','F2.3','power'),  E(km+'.6','F2.5','power')
];
const motorChain = [
  E('F2.2','M1.U','motor'), E('F2.4','M1.V','motor'), E('F2.6','M1.W','motor')
];

/* =========================================================== EXPERIMENT 1 */
function diagram1(){
  const x0=130, gap=62, cx=470;
  let p = '';
  p += D.txt(x0-26, 76, 'L1',{a:'end',s:12,w:600});
  p += D.txt(x0+gap-26, 76, 'L2',{a:'end',s:12,w:600});
  p += D.txt(x0+2*gap-26, 76, 'L3',{a:'end',s:12,w:600});
  p += D.powerColumn(x0,gap,72,120);
  p += D.pSwitch3(x0,gap,120,'Q1','MCB 16 A','mcb');
  p += D.pTermRow(x0,gap,138,['1','3','5'],{dx:26});
  p += D.pTermRow(x0,gap,190,['2','4','6'],{dx:26});
  p += D.powerColumn(x0,gap,176,212);
  p += D.pSwitch3(x0,gap,212,'KM1','main poles','contactor');
  p += D.pTermRow(x0,gap,230,['1','3','5'],{dx:26});
  p += D.pTermRow(x0,gap,282,['2','4','6'],{dx:26});
  p += D.powerColumn(x0,gap,268,304);
  p += D.pHeaters(x0,gap,304,'F2','overload heaters');
  p += D.pTermRow(x0,gap,322,['1','3','5'],{dx:26});
  p += D.pTermRow(x0,gap,374,['2','4','6'],{dx:26});
  p += D.pMotor(x0,gap,400,'M1','3-phase cage induction motor');

  let c = '';
  c += D.railTop(cx+60, cx+520, 96, 'L1');
  c += D.railBot(cx+60, cx+520, 560, 'N');
  c += D.branch(cx+220, 96, 560, [
    {t:'nc',    label:'F2  95-96', sub:'overload trip contact'},
    {t:'pbmush',label:'S1  11-12', sub:'STOP  (NC)'},
    {t:'par', gap:120,
      a:[{t:'pbno', label:'S2  13-14', sub:'START (NO)'}],
      b:[{t:'no',   label:'KM1 13-14', sub:'holding contact'}]},
    {t:'coil',  label:'KM1', sub:'contactor coil'}
  ]);
  c += D.txt(cx+60, 584, 'Control supply is tapped from L1 and N of the same simulated source.',{s:11,c:'var(--dg-dim)'});
  return D.frame({w:1060, h:620, split:430, aria:'DOL starter power and control circuit', body:p+c});
}

const exp1 = {
  id:1, code:'Experiment 1', short:'DOL starter with OLR',
  title:'DOL starter with overload relay',
  aim:'Wire and test the control and main circuit for a direct-on-line starter with overload relay.',
  plate:'EXP 1 — DIRECT-ON-LINE STARTER',
  par:300,
  camera:{target:[0.02,-0.04,0.18], dist:4.05},
  supply:'SUP',
  rails:{live:'SUP.SRC1', neutral:'SUP.SRCN', phases:['SUP.SRC1','SUP.SRC2','SUP.SRC3'],
         din:[[-0.40,0.46,1.06],[0.28,0.30,0.54],[0.28,-0.12,0.54]]},
  parts:[
    {id:'SUP', type:'supply3', x:-0.72, y:0.48},
    {id:'Q1',  type:'mcb3',    x:-0.24, y:0.44, tag:'Q1'},
    {id:'KM1', type:'contactor3p', x:0.28, y:0.30, tag:'KM1', aux:[{k:'NO',a:'13',b:'14'}]},
    {id:'F2',  type:'olr',     x:0.28, y:-0.12, tag:'F2'},
    {id:'S1',  type:'pushbutton', x:-0.78, y:-0.26, k:'NC', legend:'STOP',  tag:'S1', mushroom:true, color:'red'},
    {id:'S2',  type:'pushbutton', x:-0.40, y:-0.26, k:'NO', legend:'START', tag:'S2', color:'green'},
    {id:'M1',  type:'motor3',  x:0.74, y:-0.60, z:0.78, tag:'M1'}
  ],
  expected:[
    ...powerChain('KM1'), ...motorChain,
    E('SUP.L1','F2.95','overload'), E('F2.96','S1.11','overload'),
    E('S1.12','S2.13','control'), E('KM1.13','S2.13','control'), E('KM1.14','S2.14','control'),
    E('S2.14','KM1.A1','coil'), E('KM1.A2','SUP.N','coil')
  ],
  groups:[
    {k:'power',    label:'Power circuit'},
    {k:'motor',    label:'Motor connection'},
    {k:'overload', label:'Overload protection'},
    {k:'control',  label:'Control circuit'},
    {k:'coil',     label:'Contactor coil'}
  ],
  controls:[
    {id:'start', label:'Start', cls:'go',   kind:'hold', comp:'S2'},
    {id:'stop',  label:'Stop',  cls:'halt', kind:'hold', comp:'S1'},
    {id:'ol',    label:'Simulate overload', kind:'action'},
    {id:'reset', label:'Reset relay',       kind:'action'}
  ],
  learn:{
    lead:'A direct-on-line starter switches full line voltage onto the motor through one contactor. '+
         'The power circuit carries motor current; the control circuit carries only the small coil current.',
    parts:[
      ['MCB Q1','Short-circuit protection. Feeds L1 L2 L3 into the contactor.'],
      ['Contactor KM1','Three main poles 1-2, 3-4, 5-6 for the motor and one auxiliary NO contact 13-14.'],
      ['Overload relay F2','Heaters sit in the power path. The 95-96 NC contact sits in the control path and opens on sustained overcurrent.'],
      ['STOP S1 (NC)','Closed at rest. Breaking it collapses the coil circuit.'],
      ['START S2 (NO)','Open at rest. Completes the coil circuit only while held.'],
      ['Aux 13-14','Wired across START. Once KM1 pulls in this contact keeps the coil fed — the holding path.']
    ],
    note:SAFETY
  },
  result:'The auxiliary contact provides the holding path after the START button is released. '+
         'START briefly completes the coil circuit; once KM1 picks up, 13-14 takes over and feeds the coil '+
         'until STOP breaks the loop or the overload relay opens 95-96.',
  diagram:diagram1,
  win:(S)=> S.motorRpm > 1300,
  winText:'Motor started and running on the direct-on-line starter.'
};

/* =========================================================== EXPERIMENT 2 */
function diagram2(){
  const x0=130, gap=62, cx=470;
  let p = '';
  p += D.txt(x0-26,76,'L1',{a:'end',s:12,w:600});
  p += D.txt(x0+gap-26,76,'L2',{a:'end',s:12,w:600});
  p += D.txt(x0+2*gap-26,76,'L3',{a:'end',s:12,w:600});
  p += D.powerColumn(x0,gap,72,120);
  p += D.pSwitch3(x0,gap,120,'Q1','MCB 16 A','mcb');
  p += D.pTermRow(x0,gap,138,['1','3','5'],{dx:26}); p += D.pTermRow(x0,gap,190,['2','4','6'],{dx:26});
  p += D.powerColumn(x0,gap,176,212);
  p += D.pSwitch3(x0,gap,212,'KM1','main poles','contactor');
  p += D.pTermRow(x0,gap,230,['1','3','5'],{dx:26}); p += D.pTermRow(x0,gap,282,['2','4','6'],{dx:26});
  p += D.powerColumn(x0,gap,268,304);
  p += D.pHeaters(x0,gap,304,'F2','overload heaters');
  p += D.pTermRow(x0,gap,322,['1','3','5'],{dx:26}); p += D.pTermRow(x0,gap,374,['2','4','6'],{dx:26});
  p += D.pMotor(x0,gap,400,'M1','conveyor drive motor');

  const TOP=96, BOT=600;
  let c = D.railTop(cx+60, cx+790, TOP, 'L1') + D.railBot(cx+60, cx+790, BOT, 'N');
  c += D.branch(cx+130, TOP, BOT, [
    {t:'nc',    label:'F2  95-96', sub:'overload'},
    {t:'pbmush',label:'S1  11-12', sub:'STOP'},
    {t:'par', gap:110,
      a:[{t:'pbno', label:'S2 13-14', sub:'START'}],
      b:[{t:'no',   label:'K0 13-14', sub:'hold'}]},
    {t:'coil',  label:'K0', sub:'run relay'}
  ], 'RUN LATCH');
  c += D.branch(cx+390, TOP, BOT, [
    {t:'no',   label:'K0  23-24', sub:'run permissive'},
    {t:'nc',   label:'K1  31-32', sub:'stop pulse'},
    {t:'coil', label:'KM1', sub:'contactor coil'}
  ], 'CONVEYOR CONTACTOR');
  c += D.branch(cx+590, TOP, BOT, [
    {t:'prox', label:'S3  1-2', sub:'metal present'},
    {t:'tcoil',label:'KT', sub:'on-delay 5 s'}
  ], 'TIMER');
  c += D.branch(cx+770, TOP, BOT, [
    {t:'prox', label:'S3  1-2', sub:'same contact'},
    {t:'tnc',  label:'KT  55-56', sub:'opens at 5 s'},
    {t:'coil', label:'K1', sub:'stop-pulse relay'}
  ], 'STOP PULSE');
  c += D.txt(cx+60, BOT+40, 'Metal at S3 energises KT and K1 together. K1 31-32 drops KM1, so the belt stops.', {s:11, c:'var(--dg-dim)'});
  c += D.txt(cx+60, BOT+58, 'KT keeps timing because the billet is still in front of S3. After 5 s, 55-56 opens, K1 releases and the belt runs on.', {s:11, c:'var(--dg-dim)'});
  return D.frame({w:1480, h:700, split:430, aria:'Conveyor control with proximity switch and timer', body:p+c});
}

const exp2 = {
  id:2, code:'Experiment 2', short:'Conveyor with proximity & timer',
  title:'Conveyor motor with metal detection and 5 s stop',
  aim:'Wire and test the control and main circuit for a conveyor motor that stops for 5 seconds when a metal object is detected, using a proximity switch and a timer.',
  plate:'EXP 2 — CONVEYOR CONTROL WITH PROXIMITY SWITCH',
  par:540,
  camera:{target:[0.04,-0.10,0.30], dist:4.75},
  supply:'SUP',
  rails:{live:'SUP.SRC1', neutral:'SUP.SRCN', phases:['SUP.SRC1','SUP.SRC2','SUP.SRC3'],
         din:[[-0.44,0.50,1.00],[0.24,0.30,0.54],[0.74,0.48,0.40],[0.24,-0.14,0.54],[0.76,-0.12,0.40],[-0.62,-0.14,0.42]]},
  parts:[
    {id:'SUP', type:'supply3', x:-0.76, y:0.52},
    {id:'Q1',  type:'mcb3',    x:-0.30, y:0.48, tag:'Q1'},
    {id:'KM1', type:'contactor3p', x:0.24, y:0.30, tag:'KM1', aux:[{k:'NO',a:'13',b:'14'}]},
    {id:'K0',  type:'relay',   x:0.76, y:0.48, tag:'K0', sub:'RUN LATCH RELAY'},
    {id:'F2',  type:'olr',     x:0.24, y:-0.14, tag:'F2'},
    {id:'K1',  type:'relay',   x:-0.62, y:-0.14, tag:'K1', sub:'STOP-PULSE RELAY'},
    {id:'KT',  type:'timer',   x:0.76, y:-0.12, tag:'KT', preset:5},
    {id:'S1',  type:'pushbutton', x:-0.82, y:-0.52, k:'NC', legend:'STOP',  tag:'S1', mushroom:true, color:'red'},
    {id:'S2',  type:'pushbutton', x:-0.46, y:-0.52, k:'NO', legend:'START', tag:'S2', color:'green'},
    {id:'M1',  type:'motor3',  x:-0.66, y:-0.62, z:0.86, tag:'M1', sub:'CONVEYOR DRIVE MOTOR'},
    {id:'CV',  type:'conveyor',x:0.26,  y:-0.56, z:0.86, len:1.10},
    {id:'S3',  type:'proximity', x:0.66, y:-0.42, z:1.02, tag:'S3'}
  ],
  sensorAt:0.40,
  expected:[
    ...powerChain('KM1'), ...motorChain,
    E('SUP.L1','F2.95','overload'), E('F2.96','S1.11','overload'),
    E('S1.12','S2.13','latch'), E('K0.13','S2.13','latch'), E('K0.14','S2.14','latch'),
    E('S2.14','K0.A1','latch'), E('K0.A2','SUP.N','latch'),
    E('SUP.L1','K0.23','contactor'), E('K0.24','K1.31','contactor'),
    E('K1.32','KM1.A1','contactor'), E('KM1.A2','SUP.N','contactor'),
    E('SUP.L1','S3.1','sensor'), E('S3.2','KT.A1','sensor'), E('KT.A2','SUP.N','sensor'),
    E('S3.2','KT.55','sensor'), E('KT.56','K1.A1','sensor'), E('K1.A2','SUP.N','sensor')
  ],
  groups:[
    {k:'power',     label:'Power circuit'},
    {k:'motor',     label:'Motor connection'},
    {k:'overload',  label:'Overload protection'},
    {k:'latch',     label:'Start / stop latch  K0'},
    {k:'contactor', label:'Contactor control  KM1'},
    {k:'sensor',    label:'Proximity switch & timer'}
  ],
  controls:[
    {id:'start', label:'Start', cls:'go',   kind:'hold', comp:'S2'},
    {id:'stop',  label:'Stop',  cls:'halt', kind:'hold', comp:'S1'},
    {id:'ol',    label:'Simulate overload', kind:'action'},
    {id:'reset', label:'Reset relay',       kind:'action'}
  ],
  learn:{
    lead:'The conveyor runs on an ordinary DOL starter. A run relay K0 holds the start command, so the '+
         'contactor can be dropped and picked up again without losing it. The proximity switch and the '+
         'timer produce a 5 second stop each time a steel billet passes the sensing head.',
    parts:[
      ['Run relay K0','Latched by START through its own 13-14 contact and released by STOP. Its 23-24 contact is the run permissive for KM1.'],
      ['Proximity switch S3','2-wire inductive switch. Its contact closes while metal sits in front of the sensing face.'],
      ['Timer KT','On-delay, set to 5 s. Fed directly from S3, so it keeps timing for as long as the billet is in front of the sensor.'],
      ['Stop-pulse relay K1','Energised by S3 through the timer’s 55-56 contact. Its 31-32 NC contact breaks the KM1 coil, stopping the belt.'],
      ['Contactor KM1','Main poles to the conveyor motor; its coil is fed through K0 23-24 and K1 31-32.'],
      ['Overload relay F2','Protects the conveyor drive motor exactly as in Experiment 1.']
    ],
    note:SAFETY
  },
  result:'The timer is fed from the sensor, not from the stop relay — that is what makes the circuit settle. '+
         'While the billet sits in front of S3 the timer keeps counting, so after 5 s its 55-56 contact opens, '+
         'K1 releases and the belt restarts even though the billet has not yet moved.',
  diagram:diagram2,
  win:(S)=> S.cycleDone,
  winText:'Conveyor ran, detected the billet, stopped for 5 s and restarted by itself.'
};

/* =========================================================== EXPERIMENT 3 */
function diagram3(){
  const x0=130, gap=62, cx=470;
  let p = '';
  p += D.txt(x0-26,76,'L1',{a:'end',s:12,w:600});
  p += D.txt(x0+gap-26,76,'L2',{a:'end',s:12,w:600});
  p += D.txt(x0+2*gap-26,76,'L3',{a:'end',s:12,w:600});
  p += D.powerColumn(x0,gap,72,120);
  p += D.pSwitch3(x0,gap,120,'Q1','MCB 16 A','mcb');
  p += D.pTermRow(x0,gap,138,['1','3','5'],{dx:26}); p += D.pTermRow(x0,gap,190,['2','4','6'],{dx:26});
  p += D.powerColumn(x0,gap,176,212);
  /* sensing taps to the preventer */
  for(let i=0;i<3;i++){
    p += D.line(x0+i*gap, 196, 330-i*10, 196, {d:'4 4', w:1.4, c:'var(--dg-dim)'});
    p += D.line(330-i*10, 196, 330-i*10, 214, {d:'4 4', w:1.4, c:'var(--dg-dim)'});
    p += D.dot(x0+i*gap, 196);
  }
  p += D.rect(292, 214, 62, 44, {r:3});
  p += D.txt(323, 232, 'K3', {a:'middle', s:13, w:600});
  p += D.txt(323, 248, 'SPP', {a:'middle', s:10, c:'var(--dg-dim)'});
  p += D.txt(323, 276, 'R  Y  B', {a:'middle', s:10, c:'var(--dg-dim)'});
  p += D.pSwitch3(x0,gap,212,'KM1','main poles','contactor');
  p += D.pTermRow(x0,gap,230,['1','3','5'],{dx:26}); p += D.pTermRow(x0,gap,282,['2','4','6'],{dx:26});
  p += D.powerColumn(x0,gap,268,304);
  p += D.pHeaters(x0,gap,304,'F2','overload heaters');
  p += D.pTermRow(x0,gap,322,['1','3','5'],{dx:26}); p += D.pTermRow(x0,gap,374,['2','4','6'],{dx:26});
  p += D.pMotor(x0,gap,400,'M1','3-phase cage induction motor');

  let c = D.railTop(cx+60, cx+520, 96, 'L1') + D.railBot(cx+60, cx+520, 580, 'N');
  c += D.branch(cx+220, 96, 580, [
    {t:'nc',    label:'F2  95-96', sub:'overload trip contact'},
    {t:'no',    label:'K3  11-14', sub:'closed while all 3 phases healthy'},
    {t:'pbmush',label:'S1  11-12', sub:'STOP (NC)'},
    {t:'par', gap:120,
      a:[{t:'pbno', label:'S2 13-14', sub:'START (NO)'}],
      b:[{t:'no',   label:'KM1 13-14', sub:'holding contact'}]},
    {t:'coil',  label:'KM1', sub:'contactor coil'}
  ]);
  c += D.txt(cx+60, 606, 'K3 senses all three line voltages. Lose one phase and 11-14 opens, dropping KM1 before the motor can single-phase.',
             {s:11, c:'var(--dg-dim)'});
  return D.frame({w:1080, h:660, split:430, aria:'Single-phasing preventer power and control circuit', body:p+c});
}

const exp3 = {
  id:3, code:'Experiment 3', short:'Single-phasing preventer',
  title:'Single-phasing preventer',
  aim:'Wire and test the working of a single-phasing preventer with its control and main circuit.',
  plate:'EXP 3 — SINGLE-PHASING PREVENTER',
  par:420,
  camera:{target:[0.02,-0.02,0.18], dist:4.25},
  supply:'SUP',
  rails:{live:'SUP.SRC1', neutral:'SUP.SRCN', phases:['SUP.SRC1','SUP.SRC2','SUP.SRC3'],
         din:[[-0.42,0.48,1.02],[0.44,0.46,0.44],[0.04,0.00,0.54],[0.04,-0.42,0.54]]},
  parts:[
    {id:'SUP', type:'supply3', x:-0.76, y:0.50},
    {id:'Q1',  type:'mcb3',    x:-0.28, y:0.46, tag:'Q1'},
    {id:'K3',  type:'spp',     x:0.44,  y:0.46, tag:'K3'},
    {id:'KM1', type:'contactor3p', x:0.04, y:0.00, tag:'KM1', aux:[{k:'NO',a:'13',b:'14'}]},
    {id:'F2',  type:'olr',     x:0.04, y:-0.42, tag:'F2'},
    {id:'S1',  type:'pushbutton', x:-0.80, y:-0.30, k:'NC', legend:'STOP',  tag:'S1', mushroom:true, color:'red'},
    {id:'S2',  type:'pushbutton', x:-0.46, y:-0.30, k:'NO', legend:'START', tag:'S2', color:'green'},
    {id:'M1',  type:'motor3',  x:0.78, y:-0.60, z:0.80, tag:'M1'}
  ],
  expected:[
    ...powerChain('KM1'), ...motorChain,
    E('Q1.2','K3.R','sensing'), E('Q1.4','K3.Y','sensing'), E('Q1.6','K3.B','sensing'), E('SUP.N','K3.N','sensing'),
    E('SUP.L1','F2.95','control'), E('F2.96','K3.11','control'), E('K3.14','S1.11','control'),
    E('S1.12','S2.13','control'), E('KM1.13','S2.13','control'), E('KM1.14','S2.14','control'),
    E('S2.14','KM1.A1','control'), E('KM1.A2','SUP.N','control')
  ],
  groups:[
    {k:'power',   label:'Power circuit'},
    {k:'motor',   label:'Motor connection'},
    {k:'sensing', label:'Preventer voltage sensing'},
    {k:'control', label:'Control circuit'}
  ],
  controls:[
    {id:'start', label:'Start', cls:'go',   kind:'hold', comp:'S2'},
    {id:'stop',  label:'Stop',  cls:'halt', kind:'hold', comp:'S1'},
    {id:'ph2',   label:'Open phase L2', kind:'toggle'},
    {id:'ol',    label:'Simulate overload', kind:'action'},
    {id:'reset', label:'Reset relay',       kind:'action'}
  ],
  learn:{
    lead:'A three-phase motor left running on two phases draws heavy unbalanced current and burns out. '+
         'A single-phasing preventer watches all three line voltages and drops the contactor the moment one goes missing.',
    parts:[
      ['Preventer K3','Sensing inputs R, Y, B and N are tapped from the three lines after the MCB. R/Y/B lamps show which phases it can see.'],
      ['Output 11-14','Normally-open contact, held closed while the supply is healthy. It sits in series with the coil circuit.'],
      ['Output 11-12','Normally-closed contact, used for an alarm lamp. Not needed in this experiment.'],
      ['Contactor KM1','Ordinary DOL contactor with its own 13-14 holding contact.'],
      ['Overload relay F2','Protects against sustained overcurrent. The preventer is faster than the overload relay for phase failure.'],
      ['Test','Start the motor, then use "Open phase L2" to remove one line and watch the preventer act.']
    ],
    note:SAFETY
  },
  result:'The preventer opens 11-14 within milliseconds of losing a phase, so the contactor drops out before the '+
         'unbalanced current can damage the winding. The overload relay would eventually trip too, but only after '+
         'the motor has already been heated by the fault.',
  diagram:diagram3,
  win:(S)=> S.sppProven,
  winText:'Motor started, a phase was removed, and the preventer dropped the contactor.'
};

/* ------------------------------------------------------------------------
   Shared diagram fragments
   ---------------------------------------------------------------------- */
const PX = 130, PG = 62;                     /* power column origin and pitch */
function railLabels(){
  return D.txt(PX-26,76,'L1',{a:'end',s:12,w:600}) +
         D.txt(PX+PG-26,76,'L2',{a:'end',s:12,w:600}) +
         D.txt(PX+2*PG-26,76,'L3',{a:'end',s:12,w:600});
}
/* supply -> MCB -> contactor -> overload -> motor, the column used by most
   of the experiments; returns the svg and the y it finished at */
function powerDOL(o){
  o = o||{};
  let s = railLabels();
  s += D.powerColumn(PX,PG,72,120);
  s += D.pSwitch3(PX,PG,120,'Q1','MCB 16 A','mcb');
  s += D.pTermRow(PX,PG,138,['1','3','5'],{dx:26});
  s += D.pTermRow(PX,PG,190,['2','4','6'],{dx:26});
  s += D.powerColumn(PX,PG,176,212);
  s += D.pSwitch3(PX,PG,212,o.km||'KM1','main poles','contactor');
  s += D.pTermRow(PX,PG,230,['1','3','5'],{dx:26});
  s += D.pTermRow(PX,PG,282,['2','4','6'],{dx:26});
  s += D.powerColumn(PX,PG,268,304);
  s += D.pHeaters(PX,PG,304,'F2','overload heaters');
  s += D.pTermRow(PX,PG,322,['1','3','5'],{dx:26});
  s += D.pTermRow(PX,PG,374,['2','4','6'],{dx:26});
  s += D.pMotor(PX,PG,400,'M1',o.motorSub||'3-phase cage induction motor', o.terms);
  return s;
}
/* the start/stop latch that opens most control circuits */
const latchRung = (km, startTag)=>[
  {t:'nc',    label:'F2  95-96', sub:'overload'},
  {t:'pbmush',label:'S1  11-12', sub:'STOP'},
  {t:'par', gap:112,
    a:[{t:'pbno', label:(startTag||'S2')+' 13-14', sub:'START'}],
    b:[{t:'no',   label:km+' 13-14', sub:'hold'}]},
  {t:'coil',  label:km, sub:'contactor coil'}
];

/* ======================================================== EXPERIMENTS 4/5 */
/* Star-delta power circuit, shared by the semi-automatic and automatic
   versions. Six motor terminals, three contactors. */
function powerStarDelta(){
  let s = railLabels();
  s += D.powerColumn(PX,PG,72,120);
  s += D.pSwitch3(PX,PG,120,'Q1','MCB 16 A','mcb');
  s += D.pTermRow(PX,PG,190,['2','4','6'],{dx:26});
  s += D.powerColumn(PX,PG,176,206);
  s += D.pSwitch3(PX,PG,206,'KM1','line contactor','contactor');
  s += D.powerColumn(PX,PG,262,292);
  s += D.pHeaters(PX,PG,292,'F2','overload heaters');
  s += D.powerColumn(PX,PG,348,378);
  s += D.pTermRow(PX,PG,374,['U1','V1','W1'],{dx:10});
  /* windings drawn as three boxes, line end at the top */
  for(let i=0;i<3;i++){
    const x = PX+i*PG;
    s += D.rect(x-13,378,26,54,{r:2});
    s += D.line(x,432,x,468);
  }
  s += D.pTermRow(PX,PG,462,['U2','V2','W2'],{dx:10});
  /* star contactor: shorts the three winding ends together */
  s += D.line(PX,468,PX+2*PG,468);
  s += D.line(PX+PG,468,PX+PG,506);
  s += D.pSwitch3(PX+PG-20,1,506,'KM2','star','contactor');
  s += D.line(PX+PG-20,562,PX+PG-20,584);
  s += D.path('M'+(PX+PG-36)+' 584 l32 0 M'+(PX+PG-28)+' 592 l16 0 M'+(PX+PG-24)+' 600 l8 0',{w:2});
  s += D.txt(PX+PG+6,590,'star point',{s:11,c:'var(--dg-dim)'});
  /* delta contactor: winding ends back to the lines, rotated one phase */
  s += D.txt(PX-96,520,'KM3',{a:'end',s:13,w:600});
  s += D.txt(PX-96,536,'delta',{a:'end',s:11,c:'var(--dg-dim)'});
  s += D.txt(PX-96,556,'U2→V1  V2→W1  W2→U1',{a:'end',s:10,c:'var(--dg-dim)'});
  for(let i=0;i<3;i++){
    const x = PX+i*PG;
    s += D.dot(x,468);
    s += D.line(x,468,x-26,468);
    s += D.line(x-26,468,x-26,384+i*6);
    s += D.line(x-26,384+i*6,x-52,384+i*6,{d:'5 5',w:1.4,c:'var(--dg-dim)'});
  }
  return s;
}

function diagram4(){
  const cx = 470, TOP = 96, BOT = 620;
  let c = D.railTop(cx+60, cx+700, TOP, 'L1') + D.railBot(cx+60, cx+700, BOT, 'N');
  c += D.branch(cx+150, TOP, BOT, latchRung('KM1'), 'LINE CONTACTOR');
  c += D.branch(cx+420, TOP, BOT, [
    {t:'no',   label:'KM1 23-24', sub:'line contactor in'},
    {t:'pbnc', label:'S3  11-12', sub:'DELTA button, NC'},
    {t:'nc',   label:'KM3 31-32', sub:'delta interlock'},
    {t:'coil', label:'KM2', sub:'star contactor'}
  ], 'STAR');
  c += D.branch(cx+600, TOP, BOT, [
    {t:'no',   label:'KM1 23-24', sub:'same contact'},
    {t:'par', gap:104,
      a:[{t:'pbno', label:'S3 13-14', sub:'DELTA, NO'}],
      b:[{t:'no',   label:'KM3 13-14', sub:'hold'}]},
    {t:'nc',   label:'KM2 31-32', sub:'star interlock'},
    {t:'coil', label:'KM3', sub:'delta contactor'}
  ], 'DELTA');
  c += D.txt(cx+60, BOT+40, 'START gives line + star. Pressing DELTA breaks the star rung and latches the delta rung;',{s:11,c:'var(--dg-dim)'});
  c += D.txt(cx+60, BOT+58, 'KM2 31-32 and KM3 31-32 make it impossible for both to close together.',{s:11,c:'var(--dg-dim)'});
  return D.frame({w:1300, h:700, split:430, aria:'Semi-automatic star-delta starter', body:powerStarDelta()+c});
}

function diagram5(){
  const cx = 470, TOP = 96, BOT = 620;
  let c = D.railTop(cx+60, cx+720, TOP, 'L1') + D.railBot(cx+60, cx+720, BOT, 'N');
  c += D.branch(cx+140, TOP, BOT, latchRung('KM1'), 'LINE CONTACTOR');
  c += D.branch(cx+390, TOP, BOT, [
    {t:'no',    label:'KM1 23-24', sub:'line contactor in'},
    {t:'tcoil', label:'KT', sub:'star-delta timer'}
  ], 'TIMER');
  c += D.branch(cx+545, TOP, BOT, [
    {t:'no',   label:'KM1 23-24', sub:'same contact'},
    {t:'tnc',  label:'KT  55-56', sub:'opens at t'},
    {t:'nc',   label:'KM3 31-32', sub:'interlock'},
    {t:'coil', label:'KM2', sub:'star'}
  ], 'STAR');
  c += D.branch(cx+700, TOP, BOT, [
    {t:'no',   label:'KM1 23-24', sub:'same contact'},
    {t:'tno',  label:'KT  57-58', sub:'closes at t'},
    {t:'nc',   label:'KM2 31-32', sub:'interlock'},
    {t:'coil', label:'KM3', sub:'delta'}
  ], 'DELTA');
  c += D.txt(cx+60, BOT+40, 'One timer does the changeover: 55-56 drops the star contactor at the same instant 57-58 picks up the delta one.',{s:11,c:'var(--dg-dim)'});
  c += D.txt(cx+60, BOT+58, 'The interlocks still decide the order, so the two contactors can never be closed together.',{s:11,c:'var(--dg-dim)'});
  return D.frame({w:1380, h:700, split:430, aria:'Automatic star-delta starter', body:powerStarDelta()+c});
}

/* ========================================================== EXPERIMENT 6 */
function powerFwdRev(){
  let s = railLabels();
  s += D.powerColumn(PX,PG,72,116);
  s += D.pSwitch3(PX,PG,116,'Q1','MCB 16 A','mcb');
  s += D.powerColumn(PX,PG,172,196);
  /* the two contactors sit side by side, KMR with two phases crossed */
  for(let i=0;i<3;i++){ const x=PX+i*PG; s += D.dot(x,196) + D.line(x,196,x-40,196) + D.line(x-40,196,x-40,214); }
  s += D.pSwitch3(PX-40,PG,214,'KMF','forward','contactor');
  for(let i=0;i<3;i++){ const x=PX+i*PG; s += D.line(x,196,x+52-i*52,196); }
  s += D.line(PX,196,PX+2*PG,196,{w:0.001,c:'var(--dg-bg)'});
  s += D.txt(PX+2*PG+150,196,'',{s:1});
  /* KMR fed with L1 and L3 crossed */
  s += D.line(PX,196,PX+2*PG+120,196,{d:'5 5',w:1.4,c:'var(--dg-dim)'});
  s += D.pSwitch3(PX+2*PG+60,PG,214,'KMR','reverse','contactor');
  s += D.txt(PX+2*PG+60-18,300,'L1 and L3',{a:'end',s:10,c:'var(--dg-dim)'});
  s += D.txt(PX+2*PG+60-18,314,'crossed over',{a:'end',s:10,c:'var(--dg-dim)'});
  /* both contactor outputs join into the overload */
  for(let i=0;i<3;i++){
    const x = PX-40+i*PG, xr = PX+2*PG+60+i*PG;
    s += D.line(x,270,x,300) + D.line(x,300,PX+i*PG,300);
    s += D.line(xr,270,xr,286) + D.line(xr,286,PX+i*PG,286) + D.dot(PX+i*PG,300);
  }
  s += D.powerColumn(PX,PG,300,326);
  s += D.pHeaters(PX,PG,326,'F2','overload heaters');
  s += D.pMotor(PX,PG,420,'M1','3-phase cage induction motor');
  return s;
}
function diagram6(){
  const cx = 470, TOP = 96, BOT = 600;
  let c = D.railTop(cx+60, cx+560, TOP, 'L1') + D.railBot(cx+60, cx+560, BOT, 'N');
  c += D.branch(cx+180, TOP, BOT, [
    {t:'nc',    label:'F2  95-96', sub:'overload'},
    {t:'pbmush',label:'S1  11-12', sub:'STOP'},
    {t:'par', gap:112,
      a:[{t:'pbno', label:'S2 13-14', sub:'FORWARD'}],
      b:[{t:'no',   label:'KMF 13-14', sub:'hold'}]},
    {t:'nc',   label:'KMR 31-32', sub:'reverse interlock'},
    {t:'coil', label:'KMF', sub:'forward contactor'}
  ], 'FORWARD');
  c += D.branch(cx+460, TOP, BOT, [
    {t:'wire'},
    {t:'wire'},
    {t:'par', gap:112,
      a:[{t:'pbno', label:'S3 13-14', sub:'REVERSE'}],
      b:[{t:'no',   label:'KMR 13-14', sub:'hold'}]},
    {t:'nc',   label:'KMF 31-32', sub:'forward interlock'},
    {t:'coil', label:'KMR', sub:'reverse contactor'}
  ], 'REVERSE');
  c += D.line(cx+180, 208, cx+460, 208, {w:2});
  c += D.dot(cx+180,208) + D.dot(cx+460,208);
  c += D.txt(cx+250, 200, 'both rungs fed through the same STOP', {s:10, c:'var(--dg-dim)'});
  c += D.txt(cx+60, BOT+40, 'Each contactor coil passes through the other one’s NC contact, so only one direction can ever be closed.',{s:11,c:'var(--dg-dim)'});
  c += D.txt(cx+60, BOT+58, 'Stop before reversing: the interlock blocks a direct changeover while the first contactor is still held in.',{s:11,c:'var(--dg-dim)'});
  return D.frame({w:1140, h:680, split:430, aria:'Forward and reverse starter', body:powerFwdRev()+c});
}

/* ========================================================== EXPERIMENT 7 */
function diagram7(){
  const cx = 470, TOP = 96, BOT = 580;
  let c = D.railTop(cx+60, cx+520, TOP, 'L1') + D.railBot(cx+60, cx+520, BOT, 'N');
  c += D.branch(cx+180, TOP, BOT, [
    {t:'nc',    label:'F2  95-96', sub:'overload'},
    {t:'pbmush',label:'S1  11-12', sub:'STOP'},
    {t:'par', gap:112,
      a:[{t:'pbno', label:'S2 13-14', sub:'START'}],
      b:[{t:'no',   label:'K1 13-14', sub:'hold'}]},
    {t:'coil',  label:'K1', sub:'run relay'}
  ], 'RUN LATCH');
  c += D.branch(cx+450, TOP, BOT, [
    {t:'wire'},
    {t:'wire'},
    {t:'par', gap:112,
      a:[{t:'pbno', label:'S3 13-14', sub:'JOG'}],
      b:[{t:'no',   label:'K1 23-24', sub:'run'}]},
    {t:'coil', label:'KM1', sub:'contactor coil'}
  ], 'CONTACTOR');
  c += D.line(cx+180, 208, cx+450, 208, {w:2}) + D.dot(cx+180,208) + D.dot(cx+450,208);
  c += D.txt(cx+240, 200, 'both rungs fed through the same STOP', {s:10, c:'var(--dg-dim)'});
  c += D.txt(cx+60, BOT+40, 'START latches the run relay K1, whose 23-24 contact holds the contactor in. JOG feeds the contactor coil directly and never touches K1,',{s:11,c:'var(--dg-dim)'});
  c += D.txt(cx+60, BOT+58, 'so there is nothing to hold it and the motor stops the instant the button is released.',{s:11,c:'var(--dg-dim)'});
  return D.frame({w:1140, h:660, split:430, aria:'Jogging control circuit', body:powerDOL({})+c});
}

/* ========================================================== EXPERIMENT 8 */
function powerBrake(){
  let s = railLabels();
  s += D.powerColumn(PX,PG,72,120);
  s += D.pSwitch3(PX,PG,120,'Q1','MCB 16 A','mcb');
  s += D.powerColumn(PX,PG,176,208);
  s += D.pSwitch3(PX,PG,208,'KM1','run contactor','contactor');
  s += D.powerColumn(PX,PG,264,296);
  s += D.pHeaters(PX,PG,296,'F2','overload heaters');
  s += D.pMotor(PX,PG,392,'M1','3-phase cage induction motor');
  /* the d.c. branch arrives on two of the motor leads */
  s += D.rect(258,196,84,56,{r:3});
  s += D.txt(300,220,'T1',{a:'middle',s:13,w:600});
  s += D.txt(300,238,'d.c.',{a:'middle',s:10,c:'var(--dg-dim)'});
  s += D.path('M268 204 l64 40',{w:1.4,c:'var(--dg-dim)'});
  s += D.line(300,252,300,270);
  s += D.pSwitch3(284,26,270,'KM2','brake','contactor');
  s += D.line(284,326,284,404) + D.line(310,326,310,420);
  s += D.line(284,404,PX,404) + D.line(310,420,PX+PG,420);
  s += D.dot(PX,404) + D.dot(PX+PG,420);
  s += D.txt(346,300,'d.c. injected into',{s:10,c:'var(--dg-dim)'});
  s += D.txt(346,314,'two stator phases',{s:10,c:'var(--dg-dim)'});
  return s;
}
function diagram8(){
  const cx = 470, TOP = 96, BOT = 620;
  let c = D.railTop(cx+60, cx+660, TOP, 'L1') + D.railBot(cx+60, cx+660, BOT, 'N');
  c += D.branch(cx+130, TOP, BOT, [
    {t:'nc',    label:'F2  95-96', sub:'overload'},
    {t:'pbmush',label:'S1  11-12', sub:'STOP, NC'},
    {t:'par', gap:112,
      a:[{t:'pbno', label:'S2 13-14', sub:'START'}],
      b:[{t:'no',   label:'KM1 13-14', sub:'hold'}]},
    {t:'nc',   label:'KM2 31-32', sub:'brake interlock'},
    {t:'coil', label:'KM1', sub:'run contactor'}
  ], 'RUN');
  c += D.branch(cx+400, TOP, BOT, [
    {t:'par', gap:112,
      a:[{t:'pbno', label:'S1 13-14', sub:'STOP, NO'}],
      b:[{t:'no',   label:'K1 13-14', sub:'hold'}]},
    {t:'tnc',  label:'KT  55-56', sub:'opens at 3 s'},
    {t:'coil', label:'K1', sub:'brake latch'}
  ], 'BRAKE LATCH');
  c += D.branch(cx+580, TOP, BOT, [
    {t:'no',   label:'K1  23-24', sub:'brake on'},
    {t:'nc',   label:'KM1 31-32', sub:'run interlock'},
    {t:'coil', label:'KM2', sub:'brake contactor'}
  ], 'BRAKE');
  c += D.branch(cx+740, TOP, BOT, [
    {t:'no',    label:'K1  33-34', sub:'brake on'},
    {t:'tcoil', label:'KT', sub:'3 s brake time'}
  ], 'TIMER');
  c += D.txt(cx+60, BOT+40, 'The STOP button both breaks the run circuit and latches the brake relay. K1 closes KM2, which injects d.c. into two stator',{s:11,c:'var(--dg-dim)'});
  c += D.txt(cx+60, BOT+58, 'phases; the rotating field collapses into a stationary one and the rotor is dragged to rest. KT ends the injection after 3 s.',{s:11,c:'var(--dg-dim)'});
  return D.frame({w:1420, h:700, split:430, aria:'Dynamic braking circuit', body:powerBrake()+c});
}

/* ========================================================== EXPERIMENT 9 */
function powerRotor(){
  let s = railLabels();
  s += D.powerColumn(PX,PG,72,116);
  s += D.pSwitch3(PX,PG,116,'Q1','MCB 16 A','mcb');
  s += D.powerColumn(PX,PG,172,200);
  s += D.pSwitch3(PX,PG,200,'KM1','line contactor','contactor');
  s += D.powerColumn(PX,PG,256,284);
  s += D.pHeaters(PX,PG,284,'F2','overload heaters');
  s += D.powerColumn(PX,PG,340,366);
  s += D.pTermRow(PX,PG,362,['U','V','W'],{dx:10});
  s += D.circ(PX+PG,410,40);
  s += D.txt(PX+PG,402,'M',{a:'middle',s:22,w:700,f:'Saira Condensed, sans-serif'});
  s += D.txt(PX+PG,422,'3~',{a:'middle',s:12});
  s += D.txt(PX+PG,440,'slip ring',{a:'middle',s:10,c:'var(--dg-dim)'});
  for(let i=0;i<3;i++) s += D.line(PX+i*PG,366,PX+i*PG,376) + D.line(PX+i*PG,376,PX+PG+(i-1)*14,376);
  /* rotor circuit below the machine */
  s += D.pTermRow(PX,PG,470,['K','L','M'],{dx:10});
  for(let i=0;i<3;i++){
    const x = PX+i*PG;
    s += D.line(PX+PG+(i-1)*14,450,x,462) + D.line(x,462,x,540);
    s += D.rect(x-13,480,26,26,{r:2});
    s += D.rect(x-13,512,26,26,{r:2});
  }
  s += D.line(PX,552,PX+2*PG,552);
  s += D.txt(PX+2*PG+16,556,'star point',{s:10,c:'var(--dg-dim)'});
  for(let i=0;i<3;i++) s += D.line(PX+i*PG,540,PX+i*PG,552) + D.dot(PX+i*PG,552);
  s += D.txt(PX-24,496,'R1',{a:'end',s:13,w:600});
  s += D.txt(PX-24,512,'rotor',{a:'end',s:10,c:'var(--dg-dim)'});
  s += D.txt(PX-24,526,'resistance',{a:'end',s:10,c:'var(--dg-dim)'});
  s += D.txt(PX+2*PG+16,504,'KM2 shorts the mid taps',{s:10,c:'var(--dg-dim)'});
  s += D.txt(PX+2*PG+16,478,'KM3 shorts the slip rings',{s:10,c:'var(--dg-dim)'});
  return s;
}
function diagram9(){
  const cx = 470, TOP = 96, BOT = 620;
  let c = D.railTop(cx+60, cx+680, TOP, 'L1') + D.railBot(cx+60, cx+680, BOT, 'N');
  c += D.branch(cx+130, TOP, BOT, latchRung('KM1'), 'LINE CONTACTOR');
  c += D.branch(cx+380, TOP, BOT, [
    {t:'no',    label:'KM1 23-24', sub:'line in'},
    {t:'tcoil', label:'KT1', sub:'step 1 delay'}
  ], 'TIMER 1');
  c += D.branch(cx+520, TOP, BOT, [
    {t:'tno',  label:'KT1 57-58', sub:'closes at t1'},
    {t:'coil', label:'KM2', sub:'shorts mid taps'}
  ], 'STEP 1');
  c += D.branch(cx+660, TOP, BOT, [
    {t:'no',    label:'KM2 13-14', sub:'step 1 in'},
    {t:'tcoil', label:'KT2', sub:'step 2 delay'}
  ], 'TIMER 2');
  c += D.branch(cx+800, TOP, BOT, [
    {t:'tno',  label:'KT2 57-58', sub:'closes at t2'},
    {t:'coil', label:'KM3', sub:'shorts slip rings'}
  ], 'STEP 2');
  c += D.txt(cx+60, BOT+40, 'Full rotor resistance gives high starting torque at low current. KT1 cuts the first section, KT2 shorts the rings,',{s:11,c:'var(--dg-dim)'});
  c += D.txt(cx+60, BOT+58, 'and the machine then runs as an ordinary induction motor at full speed.',{s:11,c:'var(--dg-dim)'});
  return D.frame({w:1500, h:700, split:430, aria:'Automatic rotor resistance starter', body:powerRotor()+c});
}

/* ------------------------------------------------------------------------ */
const sdPower = [
  E('SUP.L1','Q1.1','power'), E('SUP.L2','Q1.3','power'), E('SUP.L3','Q1.5','power'),
  E('Q1.2','KM1.1','power'),  E('Q1.4','KM1.3','power'),  E('Q1.6','KM1.5','power'),
  E('KM1.2','F2.1','power'),  E('KM1.4','F2.3','power'),  E('KM1.6','F2.5','power'),
  E('F2.2','M1.U1','motor'),  E('F2.4','M1.V1','motor'),  E('F2.6','M1.W1','motor'),
  E('KM2.1','M1.U2','star'),  E('KM2.3','M1.V2','star'),  E('KM2.5','M1.W2','star'),
  E('KM2.2','KM2.4','star'),  E('KM2.4','KM2.6','star'),
  E('KM3.1','M1.U2','delta'), E('KM3.3','M1.V2','delta'), E('KM3.5','M1.W2','delta'),
  E('KM3.2','M1.V1','delta'), E('KM3.4','M1.W1','delta'), E('KM3.6','M1.U1','delta')
];
const sdMotor = {id:'M1', type:'motor3', x:0.10, y:-0.62, z:0.94, tag:'M1',
                 sub:'3-PHASE MOTOR, 6 TERMINALS', rows:[['U1','V1','W1'],['W2','U2','V2']]};
const sdGroups = [
  {k:'power', label:'Power circuit'}, {k:'motor', label:'Stator line ends'},
  {k:'star',  label:'Star contactor'}, {k:'delta', label:'Delta contactor'},
  {k:'control', label:'Control circuit'}
];
function sdMotorState(uf, C){
  const p = ['SUP.SRC1','SUP.SRC2','SUP.SRC3'];
  if(!(uf.same('M1.U1',p[0]) && uf.same('M1.V1',p[1]) && uf.same('M1.W1',p[2])))
    return {target:0, rate:0.5, mode:'Line contactor open'};
  const delta = uf.same('M1.U2',p[1]) && uf.same('M1.V2',p[2]) && uf.same('M1.W2',p[0]);
  if(delta) return {target:1440, rate:1.15, mode:'DELTA — full voltage'};
  const star = uf.same('M1.U2','M1.V2') && uf.same('M1.V2','M1.W2');
  if(star) return {target:1150, rate:0.5, mode:'STAR — 58% voltage'};
  return {target:0, rate:0.6, mode:'Windings open'};
}
const SD_LEARN = [
  ['Why star first','In star each winding sees 240 V instead of 415 V, so starting current falls to a third — and so does starting torque. Only start light loads this way.'],
  ['Line contactor KM1','Feeds L1 L2 L3 into the winding line ends U1 V1 W1 through the overload relay.'],
  ['Star contactor KM2','Its three outputs 2-4-6 are strapped together. Closing it ties U2 V2 W2 into a star point.'],
  ['Delta contactor KM3','Takes the winding ends back to the lines, rotated one phase: U2 to V1, V2 to W1, W2 to U1.'],
  ['Interlocks','KM2 31-32 and KM3 31-32 sit in each other’s coil circuits. Close both and you short two phases together.'],
  ['Overload F2','Stays in the line, so it sees line current in both star and delta.']
];

/* =========================================================== EXPERIMENT 4 */
const exp4 = {
  id:4, code:'Experiment 4', short:'Semi-automatic star–delta',
  title:'Semi-automatic star–delta starter',
  aim:'Wire and test the control and main circuit for a semi-automatic star–delta starter.',
  plate:'EXP 4 — SEMI-AUTOMATIC STAR-DELTA STARTER',
  par:900, supply:'SUP', prewire:['power','motor','star','delta'],
  camera:{target:[0.00,-0.06,0.25], dist:4.90},
  rails:{live:'SUP.SRC1', neutral:'SUP.SRCN', phases:['SUP.SRC1','SUP.SRC2','SUP.SRC3'],
         din:[[-0.40,0.50,1.02],[0.00,0.06,1.82],[0.30,-0.34,0.54]]},
  parts:[
    {id:'SUP', type:'supply3', x:-0.74, y:0.52},
    {id:'Q1',  type:'mcb3', x:-0.26, y:0.48, tag:'Q1'},
    {id:'KM1', type:'contactor3p', x:-0.60, y:0.06, tag:'KM1', sub:'LINE CONTACTOR',
     aux:[{k:'NO',a:'13',b:'14'},{k:'NO',a:'23',b:'24'}]},
    {id:'KM2', type:'contactor3p', x: 0.00, y:0.06, tag:'KM2', sub:'STAR CONTACTOR',
     aux:[{k:'NC',a:'31',b:'32'}]},
    {id:'KM3', type:'contactor3p', x: 0.60, y:0.06, tag:'KM3', sub:'DELTA CONTACTOR',
     aux:[{k:'NO',a:'13',b:'14'},{k:'NC',a:'31',b:'32'}]},
    {id:'F2',  type:'olr', x:0.30, y:-0.34, tag:'F2'},
    {id:'S1',  type:'pushbutton', x:-0.86, y:-0.34, k:'NC', legend:'STOP', tag:'S1', mushroom:true, color:'red'},
    {id:'S2',  type:'pushbutton', x:-0.56, y:-0.34, k:'NO', legend:'START', tag:'S2', color:'green'},
    {id:'S3',  type:'pushbutton', x:-0.22, y:-0.34, k:'NONC', legend:'DELTA', tag:'S3', color:'amber'},
    sdMotor
  ],
  expected:[ ...sdPower,
    E('SUP.L1','F2.95','control'), E('F2.96','S1.11','control'), E('S1.12','S2.13','control'),
    E('KM1.13','S2.13','control'), E('KM1.14','S2.14','control'),
    E('S2.14','KM1.A1','control'), E('KM1.A2','SUP.N','control'),
    E('SUP.L1','KM1.23','control'), E('KM1.24','S3.11','control'),
    E('S3.12','KM3.31','control'), E('KM3.32','KM2.A1','control'), E('KM2.A2','SUP.N','control'),
    E('KM1.24','S3.13','control'), E('KM3.13','S3.13','control'), E('KM3.14','S3.14','control'),
    E('S3.14','KM2.31','control'), E('KM2.32','KM3.A1','control'), E('KM3.A2','SUP.N','control')
  ],
  groups:sdGroups,
  controls:[
    {id:'start', label:'Start', cls:'go', kind:'hold', comp:'S2'},
    {id:'delta', label:'Delta', kind:'hold', comp:'S3'},
    {id:'stop',  label:'Stop', cls:'halt', kind:'hold', comp:'S1'},
    {id:'prewire', label:'Pre-wire power', kind:'action'},
    {id:'ol', label:'Simulate overload', kind:'action'},
    {id:'reset', label:'Reset relay', kind:'action'}
  ],
  motor:sdMotorState,
  learn:{lead:'A star–delta starter runs the motor up in star, then throws it into delta. In the semi-automatic version the operator decides when to change over by pressing a second button.', parts:SD_LEARN, note:SAFETY},
  result:'Pressing DELTA does two things at once: its NC contact breaks the star rung and its NO contact latches the delta rung. '+
         'From then on KM3 13-14 holds the delta contactor in and KM3 31-32 keeps the star contactor locked out, so releasing the button cannot put the motor back into star.',
  diagram:diagram4,
  win:(S)=> S.deltaRun,
  winText:'Started in star, changed over to delta and ran up to full speed.'
};

/* =========================================================== EXPERIMENT 5 */
const exp5 = {
  id:5, code:'Experiment 5', short:'Automatic star–delta',
  title:'Automatic star–delta starter',
  aim:'Wire and test the control and main circuit for an automatic star–delta starter.',
  plate:'EXP 5 — AUTOMATIC STAR-DELTA STARTER',
  par:900, supply:'SUP', prewire:['power','motor','star','delta'],
  camera:{target:[0.00,-0.06,0.25], dist:4.90},
  rails:{live:'SUP.SRC1', neutral:'SUP.SRCN', phases:['SUP.SRC1','SUP.SRC2','SUP.SRC3'],
         din:[[-0.40,0.50,1.02],[0.00,0.06,1.82],[0.30,-0.34,0.54],[0.84,-0.34,0.40]]},
  parts:[
    {id:'SUP', type:'supply3', x:-0.74, y:0.52},
    {id:'Q1',  type:'mcb3', x:-0.26, y:0.48, tag:'Q1'},
    {id:'KM1', type:'contactor3p', x:-0.60, y:0.06, tag:'KM1', sub:'LINE CONTACTOR',
     aux:[{k:'NO',a:'13',b:'14'},{k:'NO',a:'23',b:'24'}]},
    {id:'KM2', type:'contactor3p', x: 0.00, y:0.06, tag:'KM2', sub:'STAR CONTACTOR',
     aux:[{k:'NC',a:'31',b:'32'}]},
    {id:'KM3', type:'contactor3p', x: 0.60, y:0.06, tag:'KM3', sub:'DELTA CONTACTOR',
     aux:[{k:'NC',a:'31',b:'32'}]},
    {id:'F2',  type:'olr', x:0.30, y:-0.34, tag:'F2'},
    {id:'KT',  type:'timer', x:0.84, y:-0.34, tag:'KT', preset:6},
    {id:'S1',  type:'pushbutton', x:-0.86, y:-0.34, k:'NC', legend:'STOP', tag:'S1', mushroom:true, color:'red'},
    {id:'S2',  type:'pushbutton', x:-0.56, y:-0.34, k:'NO', legend:'START', tag:'S2', color:'green'},
    sdMotor
  ],
  expected:[ ...sdPower,
    E('SUP.L1','F2.95','control'), E('F2.96','S1.11','control'), E('S1.12','S2.13','control'),
    E('KM1.13','S2.13','control'), E('KM1.14','S2.14','control'),
    E('S2.14','KM1.A1','control'), E('KM1.A2','SUP.N','control'),
    E('SUP.L1','KM1.23','control'),
    E('KM1.24','KT.A1','control'), E('KT.A2','SUP.N','control'),
    E('KM1.24','KT.55','control'), E('KT.56','KM3.31','control'),
    E('KM3.32','KM2.A1','control'), E('KM2.A2','SUP.N','control'),
    E('KM1.24','KT.57','control'), E('KT.58','KM2.31','control'),
    E('KM2.32','KM3.A1','control'), E('KM3.A2','SUP.N','control')
  ],
  groups:sdGroups,
  controls:[
    {id:'start', label:'Start', cls:'go', kind:'hold', comp:'S2'},
    {id:'stop',  label:'Stop', cls:'halt', kind:'hold', comp:'S1'},
    {id:'prewire', label:'Pre-wire power', kind:'action'},
    {id:'ol', label:'Simulate overload', kind:'action'},
    {id:'reset', label:'Reset relay', kind:'action'}
  ],
  motor:sdMotorState,
  learn:{lead:'The automatic version replaces the operator with one timer. Press START and the starter runs up in star, changes over on its own after the set time, and settles in delta.',
    parts:SD_LEARN.concat([['Timer KT','Energised with the line contactor. 55-56 holds the star contactor in and opens at time-out; 57-58 closes at the same instant to pick up delta.']]),
    note:SAFETY},
  result:'Both changeover contacts belong to one timer, so star drops and delta picks up on the same edge. '+
         'The interlocks decide the order — KM2 has to release before KM3 can close — which is what stops the pair from shorting two lines together during the transition.',
  diagram:diagram5,
  win:(S)=> S.deltaRun,
  winText:'Ran up in star and changed over to delta automatically on the timer.'
};

/* =========================================================== EXPERIMENT 6 */
const exp6 = {
  id:6, code:'Experiment 6', short:'Forward / reverse',
  title:'Forward and reverse operation',
  aim:'Wire and test the control and main circuit for forward and reverse operation of a motor.',
  plate:'EXP 6 — FORWARD / REVERSE STARTER',
  par:700, supply:'SUP', prewire:['power','motor'],
  camera:{target:[0.00,-0.06,0.20], dist:4.55},
  rails:{live:'SUP.SRC1', neutral:'SUP.SRCN', phases:['SUP.SRC1','SUP.SRC2','SUP.SRC3'],
         din:[[-0.40,0.48,1.02],[0.00,0.02,1.56],[0.35,-0.40,0.54]]},
  parts:[
    {id:'SUP', type:'supply3', x:-0.74, y:0.50},
    {id:'Q1',  type:'mcb3', x:-0.26, y:0.46, tag:'Q1'},
    {id:'KMF', type:'contactor3p', x:-0.35, y:0.02, tag:'KMF', sub:'FORWARD',
     aux:[{k:'NO',a:'13',b:'14'},{k:'NC',a:'31',b:'32'}]},
    {id:'KMR', type:'contactor3p', x: 0.35, y:0.02, tag:'KMR', sub:'REVERSE',
     aux:[{k:'NO',a:'13',b:'14'},{k:'NC',a:'31',b:'32'}]},
    {id:'F2',  type:'olr', x:0.35, y:-0.40, tag:'F2'},
    {id:'S1',  type:'pushbutton', x:-0.86, y:-0.34, k:'NC', legend:'STOP', tag:'S1', mushroom:true, color:'red'},
    {id:'S2',  type:'pushbutton', x:-0.56, y:-0.34, k:'NO', legend:'FWD', tag:'S2', color:'green'},
    {id:'S3',  type:'pushbutton', x:-0.26, y:-0.34, k:'NO', legend:'REV', tag:'S3', color:'amber'},
    {id:'M1',  type:'motor3', x:0.86, y:-0.60, z:0.84, tag:'M1'}
  ],
  expected:[
    E('SUP.L1','Q1.1','power'), E('SUP.L2','Q1.3','power'), E('SUP.L3','Q1.5','power'),
    E('Q1.2','KMF.1','power'), E('Q1.4','KMF.3','power'), E('Q1.6','KMF.5','power'),
    E('Q1.2','KMR.5','power'), E('Q1.4','KMR.3','power'), E('Q1.6','KMR.1','power'),
    E('KMF.2','F2.1','power'), E('KMF.4','F2.3','power'), E('KMF.6','F2.5','power'),
    E('KMR.2','F2.1','power'), E('KMR.4','F2.3','power'), E('KMR.6','F2.5','power'),
    E('F2.2','M1.U','motor'), E('F2.4','M1.V','motor'), E('F2.6','M1.W','motor'),
    E('SUP.L1','F2.95','control'), E('F2.96','S1.11','control'),
    E('S1.12','S2.13','forward'), E('KMF.13','S2.13','forward'), E('KMF.14','S2.14','forward'),
    E('S2.14','KMR.31','forward'), E('KMR.32','KMF.A1','forward'), E('KMF.A2','SUP.N','forward'),
    E('S1.12','S3.13','reverse'), E('KMR.13','S3.13','reverse'), E('KMR.14','S3.14','reverse'),
    E('S3.14','KMF.31','reverse'), E('KMF.32','KMR.A1','reverse'), E('KMR.A2','SUP.N','reverse')
  ],
  groups:[
    {k:'power', label:'Power circuit'}, {k:'motor', label:'Motor connection'},
    {k:'control', label:'Overload & stop'},
    {k:'forward', label:'Forward rung'}, {k:'reverse', label:'Reverse rung'}
  ],
  controls:[
    {id:'fwd',  label:'Forward', cls:'go', kind:'hold', comp:'S2'},
    {id:'rev',  label:'Reverse', kind:'hold', comp:'S3'},
    {id:'stop', label:'Stop', cls:'halt', kind:'hold', comp:'S1'},
    {id:'prewire', label:'Pre-wire power', kind:'action'},
    {id:'ol', label:'Simulate overload', kind:'action'},
    {id:'reset', label:'Reset relay', kind:'action'}
  ],
  learn:{lead:'Reversing a three-phase motor means swapping any two of the three lines. One contactor feeds the motor straight through; the other feeds it with L1 and L3 crossed over.',
    parts:[
      ['Forward contactor KMF','Line in, line out — L1 L2 L3 straight to the overload relay.'],
      ['Reverse contactor KMR','Fed with L1 and L3 crossed, so the motor sees the opposite phase sequence.'],
      ['Electrical interlock','KMF’s coil goes through KMR 31-32 and KMR’s through KMF 31-32. Whichever picks up first locks the other out.'],
      ['Why it matters','Both contactors closed would put L1 straight onto L3 — a dead short across two phases. The interlock is the protection, not a convenience.'],
      ['STOP first','With this circuit you must stop before reversing: while one contactor is held in, its NC contact blocks the other.'],
      ['Overload F2','Common to both directions — it sits after the contactors, in the motor line.']
    ], note:SAFETY},
  result:'Swapping two lines reverses the direction of the rotating field, and the rotor follows it. '+
         'The interlock is the whole safety case for this circuit: without it, pressing both buttons shorts L1 to L3 through the two contactors.',
  diagram:diagram6,
  win:(S)=> S.fwdRun && S.revRun,
  winText:'Ran the motor in both directions with the interlock holding.'
};

/* =========================================================== EXPERIMENT 7 */
const exp7 = {
  id:7, code:'Experiment 7', short:'Jogging control',
  title:'Jogging in a cage induction motor',
  aim:'Wire and test the control and main circuit for jogging in a cage induction motor.',
  plate:'EXP 7 — JOGGING CONTROL',
  par:520, supply:'SUP', prewire:['power','motor'],
  camera:{target:[0.00,-0.04,0.18], dist:4.20},
  rails:{live:'SUP.SRC1', neutral:'SUP.SRCN', phases:['SUP.SRC1','SUP.SRC2','SUP.SRC3'],
         din:[[-0.40,0.46,1.06],[0.28,0.28,0.54],[0.28,-0.14,0.54],[0.82,-0.30,0.42]]},
  parts:[
    {id:'SUP', type:'supply3', x:-0.74, y:0.48},
    {id:'Q1',  type:'mcb3', x:-0.26, y:0.44, tag:'Q1'},
    {id:'KM1', type:'contactor3p', x:0.28, y:0.28, tag:'KM1', aux:[{k:'NO',a:'13',b:'14'}]},
    {id:'F2',  type:'olr', x:0.28, y:-0.14, tag:'F2'},
    {id:'K1',  type:'relay', x:0.82, y:-0.30, tag:'K1', sub:'RUN RELAY'},
    {id:'S1',  type:'pushbutton', x:-0.84, y:-0.32, k:'NC', legend:'STOP', tag:'S1', mushroom:true, color:'red'},
    {id:'S2',  type:'pushbutton', x:-0.54, y:-0.32, k:'NO', legend:'START', tag:'S2', color:'green'},
    {id:'S3',  type:'pushbutton', x:-0.24, y:-0.32, k:'NO', legend:'JOG', tag:'S3', color:'amber'},
    {id:'M1',  type:'motor3', x:0.80, y:-0.60, z:0.86, tag:'M1'}
  ],
  expected:[
    ...powerChain('KM1'), ...motorChain,
    E('SUP.L1','F2.95','control'), E('F2.96','S1.11','control'),
    E('S1.12','S2.13','latch'), E('K1.13','S2.13','latch'), E('K1.14','S2.14','latch'),
    E('S2.14','K1.A1','latch'), E('K1.A2','SUP.N','latch'),
    E('S1.12','S3.13','jog'), E('K1.23','S3.13','jog'), E('K1.24','S3.14','jog'),
    E('S3.14','KM1.A1','jog'), E('KM1.A2','SUP.N','jog')
  ],
  groups:[
    {k:'power', label:'Power circuit'}, {k:'motor', label:'Motor connection'},
    {k:'control', label:'Overload & stop'},
    {k:'latch', label:'Run relay K1 latch'},
    {k:'jog', label:'Jog & contactor rung'}
  ],
  controls:[
    {id:'start', label:'Start', cls:'go', kind:'hold', comp:'S2'},
    {id:'jog',   label:'Jog', kind:'hold', comp:'S3'},
    {id:'stop',  label:'Stop', cls:'halt', kind:'hold', comp:'S1'},
    {id:'ol', label:'Simulate overload', kind:'action'},
    {id:'reset', label:'Reset relay', kind:'action'}
  ],
  learn:{lead:'Jogging — inching — means running the motor in short bursts to line a machine up. The trick is a jog button that energises the contactor while deliberately breaking the holding path.',
    parts:[
      ['Run relay K1','START latches it through its own 13-14 contact. It is the only thing that remembers a start command.'],
      ['K1 23-24','Feeds the contactor coil while the relay is latched — this is the holding path for running.'],
      ['JOG S3 (NO)','Wired in parallel with K1 23-24, straight onto the contactor coil. It never energises K1.'],
      ['Why the relay','Give the contactor its own hold-in and add a jog button with an NC contact instead, and the circuit sticks: on release the NC re-closes before the contactor has dropped out, and the motor latches on.'],
      ['What you should see','START then release — motor runs on. JOG then release — motor stops immediately.'],
      ['Overload and stop','Shared by both rungs, so STOP and the overload relay kill running and jogging alike.']
    ], note:SAFETY},
  result:'Jogging works because the jog button feeds the contactor coil directly and leaves the memory element — the run relay — alone. '+
         'The tempting one-button version, with the jog NC contact breaking the contactor’s own hold-in, races the contactor’s drop-out time and latches on release. '+
         'Separating "remember the start command" from "energise the contactor" is what makes the circuit reliable.',
  diagram:diagram7,
  win:(S)=> S.latched && S.jogged,
  winText:'Demonstrated both: a latched start, and a jog that stops on release.'
};

/* =========================================================== EXPERIMENT 8 */
const exp8 = {
  id:8, code:'Experiment 8', short:'Dynamic braking',
  title:'Dynamic braking of a cage motor',
  aim:'Wire and test the control and main circuit for dynamic braking of a cage induction motor.',
  plate:'EXP 8 — DYNAMIC BRAKING BY D.C. INJECTION',
  par:800, supply:'SUP', prewire:['power','motor'],
  camera:{target:[0.00,-0.06,0.25], dist:4.80},
  rails:{live:'SUP.SRC1', neutral:'SUP.SRCN', phases:['SUP.SRC1','SUP.SRC2','SUP.SRC3'],
         din:[[-0.42,0.50,1.10],[0.00,0.06,1.70],[0.36,-0.40,1.00],[-0.50,-0.36,0.56]]},
  parts:[
    {id:'SUP', type:'supply3', x:-0.76, y:0.52},
    {id:'Q1',  type:'mcb3', x:-0.28, y:0.48, tag:'Q1'},
    {id:'KM1', type:'contactor3p', x:-0.50, y:0.06, tag:'KM1', sub:'RUN CONTACTOR',
     aux:[{k:'NO',a:'13',b:'14'},{k:'NC',a:'31',b:'32'}]},
    {id:'KM2', type:'contactor3p', x: 0.02, y:0.06, tag:'KM2', sub:'BRAKE CONTACTOR',
     aux:[{k:'NC',a:'31',b:'32'}]},
    {id:'T1',  type:'dcUnit', x:0.52, y:0.06, tag:'T1'},
    {id:'F2',  type:'olr', x:-0.50, y:-0.36, tag:'F2'},
    {id:'K1',  type:'relay', x:0.10, y:-0.40, tag:'K1', sub:'BRAKE LATCH RELAY',
     contacts:[{k:'NO',a:'13',b:'14'},{k:'NO',a:'23',b:'24'},{k:'NO',a:'33',b:'34'},{k:'NC',a:'41',b:'42'}]},
    {id:'KT',  type:'timer', x:0.62, y:-0.40, tag:'KT', preset:3},
    {id:'S1',  type:'pushbutton', x:-0.84, y:-0.36, k:'NONC', legend:'STOP', tag:'S1', mushroom:true, color:'red'},
    {id:'S2',  type:'pushbutton', x:-0.84, y:-0.04, k:'NO', legend:'START', tag:'S2', color:'green'},
    {id:'M1',  type:'motor3', x:0.24, y:-0.62, z:0.98, tag:'M1'}
  ],
  expected:[
    ...powerChain('KM1'), ...motorChain,
    E('SUP.L1','T1.L','dc'), E('SUP.N','T1.N','dc'),
    E('T1.+','KM2.1','dc'), E('T1.-','KM2.3','dc'),
    E('KM2.2','M1.U','dc'), E('KM2.4','M1.V','dc'),
    E('SUP.L1','F2.95','control'), E('F2.96','S1.11','control'),
    E('S1.12','S2.13','control'), E('KM1.13','S2.13','control'), E('KM1.14','S2.14','control'),
    E('S2.14','KM2.31','control'), E('KM2.32','KM1.A1','control'), E('KM1.A2','SUP.N','control'),
    E('SUP.L1','S1.13','brake'), E('K1.13','S1.13','brake'), E('K1.14','S1.14','brake'),
    E('S1.14','KT.55','brake'), E('KT.56','K1.A1','brake'), E('K1.A2','SUP.N','brake'),
    E('SUP.L1','K1.23','brake'), E('K1.24','KM1.31','brake'),
    E('KM1.32','KM2.A1','brake'), E('KM2.A2','SUP.N','brake'),
    E('SUP.L1','K1.33','brake'), E('K1.34','KT.A1','brake'), E('KT.A2','SUP.N','brake')
  ],
  groups:[
    {k:'power', label:'Power circuit'}, {k:'motor', label:'Motor connection'},
    {k:'dc', label:'D.C. injection circuit'},
    {k:'control', label:'Run circuit'}, {k:'brake', label:'Brake circuit'}
  ],
  controls:[
    {id:'start', label:'Start', cls:'go', kind:'hold', comp:'S2'},
    {id:'stop',  label:'Stop & brake', cls:'halt', kind:'hold', comp:'S1'},
    {id:'prewire', label:'Pre-wire power', kind:'action'},
    {id:'ol', label:'Simulate overload', kind:'action'},
    {id:'reset', label:'Reset relay', kind:'action'}
  ],
  motor(uf, C){
    const p = ['SUP.SRC1','SUP.SRC2','SUP.SRC3'];
    if(uf.same('M1.U',p[0]) && uf.same('M1.V',p[1]) && uf.same('M1.W',p[2]))
      return {target:1440, rate:1.05, mode:'Running'};
    const dc = C.T1 && C.T1.st.dcOn && uf.same('M1.U','T1.+') && uf.same('M1.V','T1.-');
    if(dc) return {target:0, rate:3.4, mode:'D.C. injection braking'};
    return {target:0, rate:0.42, mode:'Coasting'};
  },
  learn:{lead:'Cut the supply to a cage motor and it coasts for a long time. Feed direct current into two stator phases instead and the rotating field becomes a stationary one — the rotor is dragged to a standstill in a couple of seconds.',
    parts:[
      ['Run contactor KM1','Normal DOL running, with the usual hold-in contact.'],
      ['Brake contactor KM2','Switches the d.c. onto two of the motor leads. Interlocked against KM1 — a.c. and d.c. must never meet.'],
      ['D.C. unit T1','A bridge rectifier fed from the control supply. Its + and − go to the brake contactor.'],
      ['STOP S1','A changeover button: the NC contact drops the run contactor, the NO contact starts the brake.'],
      ['Brake latch K1','Holds the brake in after the button is released, so the injection lasts a fixed time.'],
      ['Timer KT','Set to 3 s. Its 55-56 contact releases K1, ending the injection so the windings are not left carrying d.c.']
    ], note:SAFETY},
  result:'D.C. in the stator produces a stationary magnetic field. The still-turning rotor cuts it, induces current in its own bars, '+
         'and the resulting torque opposes rotation — so the machine brakes itself, with its own kinetic energy dissipated as rotor heat. '+
         'The timer matters: leave the d.c. on with the rotor stopped and you are just heating the winding.',
  diagram:diagram8,
  win:(S)=> S.braked,
  winText:'Ran the motor, then brought it to rest with d.c. injection braking.'
};

/* =========================================================== EXPERIMENT 9 */
const exp9 = {
  id:9, code:'Experiment 9', short:'Rotor resistance starter',
  title:'Automatic rotor resistance starter',
  aim:'Wire and test the control and main circuit for an automatic rotor resistance starter.',
  plate:'EXP 9 — AUTOMATIC ROTOR RESISTANCE STARTER',
  par:1000, supply:'SUP', prewire:['power','stator','rotor'],
  camera:{target:[0.00,-0.08,0.30], dist:5.10},
  rails:{live:'SUP.SRC1', neutral:'SUP.SRCN', phases:['SUP.SRC1','SUP.SRC2','SUP.SRC3'],
         din:[[-0.42,0.52,1.10],[0.00,0.12,1.82],[0.23,-0.32,1.02],[-0.60,-0.30,0.56]]},
  parts:[
    {id:'SUP', type:'supply3', x:-0.76, y:0.54},
    {id:'Q1',  type:'mcb3', x:-0.28, y:0.50, tag:'Q1'},
    {id:'KM1', type:'contactor3p', x:-0.60, y:0.12, tag:'KM1', sub:'LINE CONTACTOR',
     aux:[{k:'NO',a:'13',b:'14'},{k:'NO',a:'23',b:'24'}]},
    {id:'KM2', type:'contactor3p', x: 0.00, y:0.12, tag:'KM2', sub:'STEP 1',
     aux:[{k:'NO',a:'13',b:'14'}]},
    {id:'KM3', type:'contactor3p', x: 0.60, y:0.12, tag:'KM3', sub:'STEP 2',
     aux:[{k:'NO',a:'13',b:'14'}]},
    {id:'F2',  type:'olr', x:-0.60, y:-0.30, tag:'F2'},
    {id:'KT1', type:'timer', x:0.02, y:-0.32, tag:'KT1', preset:5},
    {id:'KT2', type:'timer', x:0.44, y:-0.32, tag:'KT2', preset:5},
    {id:'S1',  type:'pushbutton', x:0.92, y:-0.02, k:'NC', legend:'STOP', tag:'S1', mushroom:true, color:'red'},
    {id:'S2',  type:'pushbutton', x:0.92, y:-0.32, k:'NO', legend:'START', tag:'S2', color:'green'},
    {id:'R1',  type:'resistorBank', x:-0.48, y:-0.52, z:1.00, tag:'R1'},
    {id:'M1',  type:'motor3', x:0.52, y:-0.60, z:1.00, tag:'M1', sub:'SLIP-RING INDUCTION MOTOR',
     rows:[['U','V','W'],['K','L','M']], rotorTerms:['K','L','M'], rating:'3~ slip ring 1440 rpm'}
  ],
  expected:[
    ...powerChain('KM1'),
    E('F2.2','M1.U','stator'), E('F2.4','M1.V','stator'), E('F2.6','M1.W','stator'),
    E('M1.K','R1.1','rotor'), E('M1.L','R1.3','rotor'), E('M1.M','R1.5','rotor'),
    E('KM2.1','R1.2','rotor'), E('KM2.3','R1.4','rotor'), E('KM2.5','R1.6','rotor'),
    E('KM2.2','KM2.4','rotor'), E('KM2.4','KM2.6','rotor'),
    E('KM3.1','M1.K','rotor'), E('KM3.3','M1.L','rotor'), E('KM3.5','M1.M','rotor'),
    E('KM3.2','KM3.4','rotor'), E('KM3.4','KM3.6','rotor'),
    E('SUP.L1','F2.95','control'), E('F2.96','S1.11','control'), E('S1.12','S2.13','control'),
    E('KM1.13','S2.13','control'), E('KM1.14','S2.14','control'),
    E('S2.14','KM1.A1','control'), E('KM1.A2','SUP.N','control'),
    E('SUP.L1','KM1.23','steps'), E('KM1.24','KT1.A1','steps'), E('KT1.A2','SUP.N','steps'),
    E('SUP.L1','KT1.57','steps'), E('KT1.58','KM2.A1','steps'), E('KM2.A2','SUP.N','steps'),
    E('SUP.L1','KM2.13','steps'), E('KM2.14','KT2.A1','steps'), E('KT2.A2','SUP.N','steps'),
    E('SUP.L1','KT2.57','steps'), E('KT2.58','KM3.A1','steps'), E('KM3.A2','SUP.N','steps')
  ],
  groups:[
    {k:'power', label:'Stator power circuit'}, {k:'stator', label:'Stator terminals'},
    {k:'rotor', label:'Rotor resistance circuit'},
    {k:'control', label:'Start / stop circuit'}, {k:'steps', label:'Timed step circuit'}
  ],
  controls:[
    {id:'start', label:'Start', cls:'go', kind:'hold', comp:'S2'},
    {id:'stop',  label:'Stop', cls:'halt', kind:'hold', comp:'S1'},
    {id:'prewire', label:'Pre-wire power', kind:'action'},
    {id:'ol', label:'Simulate overload', kind:'action'},
    {id:'reset', label:'Reset relay', kind:'action'}
  ],
  motor(uf, C){
    const p = ['SUP.SRC1','SUP.SRC2','SUP.SRC3'];
    if(!(uf.same('M1.U',p[0]) && uf.same('M1.V',p[1]) && uf.same('M1.W',p[2])))
      return {target:0, rate:0.5, mode:'Stator not energised'};
    /* the bank is star connected, so K L M are always commoned through its star
       point — a genuine rotor short is KM3 closed onto the rings themselves */
    if(C.KM3 && C.KM3.st.energised && uf.same('KM3.1','M1.K') && uf.same('KM3.2','KM3.4'))
      return {target:1440, rate:1.1, mode:'Step 2 — rotor short-circuited'};
    const rotor = uf.same('M1.K','R1.1') && uf.same('M1.L','R1.3') && uf.same('M1.M','R1.5');
    if(!rotor) return {target:0, rate:0.6, mode:'Rotor circuit open'};
    const step1 = C.KM2 && C.KM2.st.energised && uf.same('KM2.1','R1.2') && uf.same('KM2.2','KM2.4');
    if(step1) return {target:1240, rate:0.85, mode:'Step 1 — half resistance'};
    return {target:940, rate:0.62, mode:'Starting — full rotor resistance'};
  },
  learn:{lead:'A slip-ring motor brings its rotor winding out to three rings. Starting with resistance in the rotor gives high torque at low current; the resistance is then cut out in steps as the machine runs up.',
    parts:[
      ['Slip-ring motor M1','Stator U V W to the line, rotor K L M out to the rings.'],
      ['Resistance bank R1','Two sections per phase, star connected. Terminals 1-3-5 take full resistance, 2-4-6 are the mid taps.'],
      ['Step 1 — KM2','Shorts the mid taps together, cutting the lower half of each phase’s resistance.'],
      ['Step 2 — KM3','Shorts the slip rings themselves. The machine now runs as an ordinary induction motor.'],
      ['Timers KT1, KT2','KT1 runs from the line contactor and closes step 1. KM2 then starts KT2, which closes step 2.'],
      ['What to watch','The speed readout climbs in three stages — about 940, 1240 and 1440 rpm.']
    ], note:SAFETY},
  result:'Rotor resistance shifts the torque-slip curve so maximum torque happens near standstill — high starting torque with modest current. '+
         'Cutting the resistance in steps keeps the torque high as the motor accelerates, and shorting the rings at the end gives normal running with low slip.',
  diagram:diagram9,
  win:(S)=> S.step2Run,
  winText:'Started on full rotor resistance and ran up through both steps to full speed.'
};

/* ========================================================== EXPERIMENT 10 */
function diagram10(){
  const cx = 470, TOP = 96, BOT = 560;
  let c = D.railTop(cx+60, cx+520, TOP, 'L1') + D.railBot(cx+60, cx+520, BOT, 'N');
  c += D.branch(cx+220, TOP, BOT, latchRung('KM1'));
  c += D.txt(cx+60, BOT+40, 'This is the correct circuit. The panel in front of you does not match it in three places — find them.',{s:11,c:'var(--dg-dim)'});
  return D.frame({w:1060, h:640, split:430, aria:'Fault finding reference circuit', body:powerDOL({})+c});
}
const exp10 = {
  id:10, code:'Experiment 10', short:'Control panel fault finding',
  title:'Control panel fault finding',
  aim:'Locate and correct the wiring faults in a pre-wired direct-on-line control panel, then prove it by running the motor.',
  plate:'EXP 10 — FAULT FINDING',
  par:600, supply:'SUP', faultFinding:true,
  camera:{target:[0.02,-0.04,0.18], dist:4.05},
  rails:{live:'SUP.SRC1', neutral:'SUP.SRCN', phases:['SUP.SRC1','SUP.SRC2','SUP.SRC3'],
         din:[[-0.40,0.46,1.06],[0.28,0.30,0.54],[0.28,-0.12,0.54]]},
  parts:[
    {id:'SUP', type:'supply3', x:-0.72, y:0.48},
    {id:'Q1',  type:'mcb3', x:-0.24, y:0.44, tag:'Q1'},
    {id:'KM1', type:'contactor3p', x:0.28, y:0.30, tag:'KM1', aux:[{k:'NO',a:'13',b:'14'}]},
    {id:'F2',  type:'olr', x:0.28, y:-0.12, tag:'F2'},
    {id:'S1',  type:'pushbutton', x:-0.78, y:-0.26, k:'NC', legend:'STOP', tag:'S1', mushroom:true, color:'red'},
    {id:'S2',  type:'pushbutton', x:-0.40, y:-0.26, k:'NO', legend:'START', tag:'S2', color:'green'},
    {id:'M1',  type:'motor3', x:0.74, y:-0.60, z:0.78, tag:'M1'}
  ],
  expected:[
    ...powerChain('KM1'), ...motorChain,
    E('SUP.L1','F2.95','overload'), E('F2.96','S1.11','overload'),
    E('S1.12','S2.13','control'), E('KM1.13','S2.13','control'), E('KM1.14','S2.14','control'),
    E('S2.14','KM1.A1','coil'), E('KM1.A2','SUP.N','coil')
  ],
  groups:[
    {k:'power', label:'Power circuit'}, {k:'motor', label:'Motor connection'},
    {k:'overload', label:'Overload protection'},
    {k:'control', label:'Control circuit'}, {k:'coil', label:'Contactor coil'}
  ],
  controls:[
    {id:'start', label:'Start', cls:'go', kind:'hold', comp:'S2'},
    {id:'stop',  label:'Stop', cls:'halt', kind:'hold', comp:'S1'},
    {id:'refault', label:'New fault set', kind:'action'},
    {id:'reset', label:'Reset relay', kind:'action'}
  ],
  learn:{lead:'The panel is already wired — badly. Three faults have been built into it: wires missing, wires on the wrong terminal, or a device left in the wrong state. Find them, fix them, and prove the starter works.',
    parts:[
      ['Start with the drawing','Open the circuit diagram and trace one branch at a time against the panel.'],
      ['Wire Check','Tells you which section fails, but not which wire. That is your job.'],
      ['Flagged wires','A wire on the wrong terminal shows in magenta. Tap it twice to remove it.'],
      ['Device state','Not every fault is a wire. Check the MCB handle and the overload relay’s trip flag.'],
      ['Work in order','Supply, then power circuit, then control circuit, then the coil. Random poking wastes time.'],
      ['Prove it','The experiment is only complete when the motor actually runs and holds in.']
    ], note:SAFETY},
  result:'Fault finding is trace-and-compare, not guesswork: take the drawing branch by branch, check continuity of each link against it, '+
         'and confirm device states before suspecting wiring. Most panel faults are a loose or wrong-terminal connection at a junction where two wires share one terminal.',
  diagram:diagram10,
  win:(S)=> S.motorRpm > 1300,
  winText:'All three faults cleared and the starter proved on load.'
};

return [exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8, exp9, exp10];
})();
