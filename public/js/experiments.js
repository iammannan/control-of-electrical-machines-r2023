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

/* --------------------------------- experiments still being built -------- */
const soon = (id, short, title, aim)=>({id, code:'Experiment '+id, short, title, aim, soon:true});
const rest = [
  soon(4,'Semi-automatic star–delta','Semi-automatic star–delta starter',
       'Wire and test the control and main circuit for a semi-automatic star–delta starter.'),
  soon(5,'Automatic star–delta','Automatic star–delta starter',
       'Wire and test the control and main circuit for an automatic star–delta starter.'),
  soon(6,'Forward / reverse','Forward and reverse operation',
       'Wire and test the control and main circuit for forward and reverse operation of a motor.'),
  soon(7,'Jogging control','Jogging in a cage induction motor',
       'Wire and test the control and main circuit for jogging in a cage induction motor.'),
  soon(8,'Dynamic braking','Dynamic braking of a cage motor',
       'Wire and test the control and main circuit for dynamic braking of a cage induction motor.'),
  soon(9,'Rotor resistance starter','Automatic rotor resistance starter',
       'Wire and test the control and main circuit for an automatic rotor resistance starter.'),
  soon(10,'Fault finding','Control panel fault finding',
       'Locate and correct wiring faults in a running control panel.')
];

return [exp1, exp2, exp3, ...rest];
})();
