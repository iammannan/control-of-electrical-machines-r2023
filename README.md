# COEM Wiring Lab

A simulated control-wiring laboratory for the Control of Electrical Machines
practical. Students wire a 3D panel terminal by terminal, run a continuity
check, operate the circuit and watch it behave — and every experiment carries
its IEC circuit diagram with the same terminal numbers printed on the panel.

Static site. No backend, no database, no Cloud Functions, so it stays on the
Firebase **Spark** (free) plan with no billing account attached, and it deploys
to GitHub Pages from the same repo without any changes.

---

## What is in it

| # | Experiment | Wires | Notes |
|---|------------|-------|-------|
| 01 | DOL starter with overload relay | 19 | Hold-in contact, overload trip |
| 02 | Conveyor, metal detection, 5 s stop | 29 | Proximity switch + on-delay timer |
| 03 | Single-phasing preventer | 24 | Phase-failure relay, injectable phase loss |
| 04 | Semi-automatic star–delta starter | 41 | Changeover button, mutual interlock |
| 05 | Automatic star–delta starter | 41 | One timer does the changeover |
| 06 | Forward and reverse operation | 32 | Two lines crossed, electrical interlock |
| 07 | Jogging in a cage induction motor | 24 | Run relay + jog button |
| 08 | Dynamic braking of a cage motor | 39 | D.C. injection, timed |
| 09 | Automatic rotor resistance starter | 44 | Slip-ring motor, two timed steps |
| 10 | Control panel fault finding | — | Three randomised faults to find |

All ten are playable. Each experiment has: a Learn First briefing, a full 3D panel, a terminal
finder, a wiring schedule that ticks off as you work, a continuity report,
operating controls, a fault to inject, an IEC circuit diagram and a scored
result.

The heavier experiments carry a **Pre-wire power** button that runs the
power-circuit wires for the student at a cost of 100 marks, so a beginner can
spend the session on the control logic instead of on 23 power connections.

---

## How the simulation works

The circuit is not scripted. Every frame the engine builds a **netlist** from
the wires the student has actually run plus the internal links of every device
for its current contact state, unions it with a disjoint-set structure, and
iterates to a fixed point. Coil states are part of that fixed point, which is
why hold-in (latching) circuits latch by themselves and why a wrong wire simply
fails to work rather than being caught by a rule.

That also means the engine reports genuine faults: a line-to-neutral short, a
phase-to-phase short, or a relay whose own contact breaks its own coil
(chatter). Close the star and delta contactors together, or both direction
contactors in Experiment 6, and it reports the phase-to-phase short those
interlocks exist to prevent.

Speed is modelled per experiment where it carries a lesson: star runs up to
about 1150 rpm and delta to 1440; the rotor-resistance starter climbs in three
stages; d.c. injection decays the speed roughly eight times faster than
coasting.

---

## Files

    public/
      index.html        lab index + simulator shell
      css/app.css       all styling
      js/three.min.js   Three.js r128, self-hosted
      js/engine.js      scene, terminals, wires, the netlist solver, input
      js/parts.js       component library (contactor, OLR, timer, relay, SPP, …)
      js/diagram.js     IEC symbol library and diagram composer
      js/experiments.js the experiment definitions — this is the file to edit
      js/app.js         lab index, routing, scoring, per-experiment simulation
    firebase.json       hosting config and cache headers
    .firebaserc         project id — edit this first

## Deploy

    npm install -g firebase-tools
    firebase login
    firebase use --add            # or edit .firebaserc
    firebase deploy --only hosting

Live at `https://<project-id>.web.app`, HTTPS handled automatically.
Direct links to an experiment work too: `https://<project-id>.web.app/#exp2`.

Test locally first:

    firebase serve --only hosting     # http://localhost:5000

## Deploy to GitHub Pages

The repo also carries `.github/workflows/pages.yml`, which publishes `public/`
to Pages on every push to `main`. Nothing has to move: the same repo still
deploys to Firebase with `firebase deploy --only hosting`.

    git init
    git add -A
    git commit -m "COEM Wiring Lab"
    git branch -M main
    git remote add origin https://github.com/<user>/<repo>.git
    git push -u origin main

Then in the repo: **Settings -> Pages -> Build and deployment -> Source:
GitHub Actions**. The next push publishes to
`https://<user>.github.io/<repo>/`, and a direct experiment link is
`https://<user>.github.io/<repo>/#exp2`.

Two things to know. Pages on a free account serves **public repositories**
only, so the source is visible to anyone. And a project site lives under a
subpath — every asset path in this project is already relative, so that works
without changes.

## Free tier headroom

Spark gives 10 GB storage and 10 GB/month CDN transfer. A cold visit is about
700 KB, so roughly 14,000 first-time loads a month; `three.min.js` carries a
one-year immutable cache header so repeat visits cost almost nothing.

---

## Adding an experiment

Everything an experiment needs lives in one object in `js/experiments.js`:

```js
{
  id, code, short, title, aim, plate, par,
  camera:{target:[x,y,z], dist},
  rails:{live, neutral, phases:[...], din:[[x,y,w],...]},
  parts:[{id, type, x, y, ...}],        // types come from js/parts.js
  expected:[{a:'SUP.L1', b:'Q1.1', g:'power'}, ...],
  groups:[{k:'power', label:'Power circuit'}, ...],
  controls:[...],
  learn:{lead, parts:[[name, description]], note},
  result, diagram(), win(R), winText
}
```

Terminals are addressed as `COMPONENT.TERMINAL` using the real IEC marking —
`KM1.A1`, `F2.95`, `S2.13`. Add a device type to `js/parts.js` with a `build()`
that places its terminals and a `links()` that returns the pairs conducting
right now, and the solver handles the rest.

---

## Safety

Every screen is marked SIMULATION ONLY. The "415 V" source is a node in
software; nothing on the bench is energised and nothing in this application is
an instruction for working on real equipment.
