/**
 * The build engine.
 *
 * Framework-agnostic on purpose: React renders the page once, this module drives every
 * frame imperatively. Nothing here sets React state, so the 60fps loop never triggers a
 * re-render — that is what keeps the page smooth on a phone.
 *
 * mountEngine() returns a teardown function that removes every listener, timer, observer
 * and the AudioContext. React StrictMode mounts twice in development; the teardown has to
 * be complete or the second mount doubles the agents.
 */

export type HudRefs = {
  root: HTMLElement;
  agents: HTMLElement;
  done: HTMLElement;
  total: HTMLElement;
  bar: HTMLElement;
  status: HTMLElement;
  play: HTMLButtonElement;
  auto: HTMLButtonElement;
  speed: HTMLButtonElement;
  sound: HTMLButtonElement;
  replay: HTMLButtonElement;
};

export type EngineOptions = {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  boot: HTMLElement;
  bootNote: HTMLElement;
  hudRoot: HTMLElement;
  accents: Record<string, string>;
  accentNames: string[];
  finalAccent: string;
  finale: string[];
  agentCount: number;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a = 1, b?: number) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

const HUES = ["#ff6b5e", "#ffb02e", "#ffe14d", "#7dff8f", "#35e0c2", "#4db8ff", "#8f93ff", "#d07bff", "#ff7ac8"];
const ROLES = ["layout", "type", "color", "copy", "motion", "pixels"];
const PLAY_ICON = '<path d="M2 1l9 5-9 5z"/>';
const PAUSE_ICON = '<path d="M2 1h3v10H2zM7 1h3v10H7z"/>';
const REPLAY_ICON = '<path d="M6 1.5A4.5 4.5 0 1010.5 6H9a3 3 0 11-3-3v2l3.5-2.75L6 0z"/>';

const ARROW_SVG = (c: string) =>
  `<svg class="arrow" viewBox="0 0 17 22"><path d="M2 1.5v16l4.4-4 3 7 2.6-1.1-3-6.9h6z" fill="${c}" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const CROSS_SVG = `<svg class="cross" viewBox="0 0 18 18"><path d="M9 1v16M1 9h16" stroke="#050506" stroke-width="4.4" stroke-linecap="round"/><path d="M9 1v16M1 9h16" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;
const IBEAM_SVG = `<svg class="ibeam" viewBox="0 0 18 18"><path d="M5.5 1.5h7M5.5 16.5h7M9 1.5v15" stroke="#050506" stroke-width="4.2" stroke-linecap="round"/><path d="M5.5 1.5h7M5.5 16.5h7M9 1.5v15" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>`;

type Timer = { t: number; res: () => void };
type Tween = { t0: number; dur: number; fn: (k: number) => void; res: () => void };

export function mountEngine(opts: EngineOptions): () => void {
  const { stage, canvas, boot, bootNote, hudRoot, accents, accentNames, finalAccent, finale, agentCount } = opts;
  const root = document.documentElement;
  const $ = <T extends Element = Element>(sel: string, scope: ParentNode = document) => scope.querySelector<T>(sel);
  const $$ = <T extends Element = Element>(sel: string, scope: ParentNode = document) => Array.from(scope.querySelectorAll<T>(sel));

  const hud: HudRefs = {
    root: hudRoot,
    agents: hudRoot.querySelector<HTMLElement>("#nAgents")!,
    done: hudRoot.querySelector<HTMLElement>("#nDone")!,
    total: hudRoot.querySelector<HTMLElement>("#nAll")!,
    bar: hudRoot.querySelector<HTMLElement>("#bar")!,
    status: hudRoot.querySelector<HTMLElement>("#st")!,
    play: hudRoot.querySelector<HTMLButtonElement>("#bTour")!,
    auto: hudRoot.querySelector<HTMLButtonElement>("#bAuto")!,
    speed: hudRoot.querySelector<HTMLButtonElement>("#bSpeed")!,
    sound: hudRoot.querySelector<HTMLButtonElement>("#bSound")!,
    replay: hudRoot.querySelector<HTMLButtonElement>("#bReplay")!,
  };
  for (const [key, el] of Object.entries(hud)) {
    if (!el) throw new Error(`engine: HUD element for ${key} is missing`);
  }

  /* ---------------------------------------------------------------- clock */
  // Virtual time: every scheduled thing (delays and tweens) lives on this clock, so the
  // whole choreography can be paused, slowed or sped up without drifting.
  let vt = 0;
  let speed = clamp(parseFloat(new URLSearchParams(location.search).get("speed") ?? "1") || 1, 0.25, 4);
  let paused = false;
  const timers = new Set<Timer>();
  const tweens = new Set<Tween>();
  const wait = (ms: number) => new Promise<void>((res) => timers.add({ t: vt + ms, res }));
  const tween = (dur: number, fn: (k: number) => void) =>
    new Promise<void>((res) => tweens.add({ t0: vt, dur: Math.max(1, dur), fn, res }));

  /* ---------------------------------------------------------------- sound */
  const sound = {
    ctx: null as AudioContext | null,
    on: true,
    lastTick: 0,
    // one resume per gesture, returned to the caller — no second resume from inside tone()
    unlock() {
      if (!this.ctx) {
        try {
          const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          this.ctx = new Ctor();
          this.ctx.createGain().connect(this.ctx.destination);
        } catch {
          this.ctx = null;
          return Promise.resolve();
        }
      }
      const ctx = this.ctx;
      if (ctx.state === "running") return Promise.resolve();
      return ctx.resume().catch(() => {});
    },
    tone(freq: number, dur = 0.13, type: OscillatorType = "triangle", vol = 0.07, delay = 0) {
      const ctx = this.ctx;
      if (!this.on || !ctx || ctx.state !== "running") return;
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
    tick() {
      const now = performance.now();
      if (now - this.lastTick < 34) return;
      this.lastTick = now;
      this.tone(rand(1700, 2300), 0.025, "square", 0.012);
    },
    pop(progress: number) {
      const scale = [0, 2, 4, 7, 9];
      const step = Math.floor(progress * 12) + Math.floor(rand(3));
      const semis = scale[step % 5] + 12 * Math.floor(step / 5);
      this.tone(220 * Math.pow(2, semis / 12), 0.16, "triangle", 0.06);
    },
    chord() {
      [0, 4, 7, 12, 16].forEach((s, i) => this.tone(330 * Math.pow(2, s / 12), 0.9, "triangle", 0.05, i * 0.07));
    },
    // the mega "DEVELOPER" reveal: a deep sine drop, cinematic but restrained
    boom() {
      const ctx = this.ctx;
      if (!this.on || !ctx || ctx.state !== "running") return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(82, t + 0.42);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.52);
    },
    whoosh() {
      this.tone(180, 0.5, "sawtooth", 0.02);
      this.tone(90, 0.6, "sine", 0.06);
    },
    close() {
      void this.ctx?.close();
      this.ctx = null;
    },
  };

  /* ---------------------------------------------------------------- geometry */
  const rectOf = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
  };

  /* ---------------------------------------------------------------- agents */
  type Mode = "arrow" | "cross" | "ibeam";
  type IdleMode = "wander" | "ring" | "drifter" | "radar" | "shimmer";

  class Agent {
    el: HTMLDivElement;
    index: number;
    total: number;
    x = 0;
    y = 0;
    vx = 0;
    vy = 0;
    phase = rand(Math.PI * 2);
    rad = rand(0.75, 1.25);
    spin = rand(0.9, 1.5) * (Math.random() < 0.5 ? 1 : -1);
    wanderTarget: { x: number; y: number } | null = null;
    wanderUntil = 0;
    // pre-start squad: which of the three idle patterns walks this cursor
    squad: "drifter" | "radar" | "shimmer" = "drifter";
    idle = true;

    constructor(i: number, n: number) {
      const color = HUES[i % HUES.length];
      this.index = i;
      this.total = n;
      this.x = innerWidth / 2 + rand(-40, 40);
      this.y = innerHeight / 2 + rand(-40, 40);
      const el = document.createElement("div");
      el.className = "agent";
      el.style.color = color;
      el.innerHTML = ARROW_SVG(color) + CROSS_SVG + IBEAM_SVG + '<span class="ring"></span>' + (ROLES[i] ? `<label style="background:${color}">${ROLES[i]}</label>` : "");
      this.el = el;
      stage.appendChild(el);
    }

    mode(m: Mode) {
      this.el.dataset.mode = m;
    }

    click() {
      this.el.classList.remove("click");
      void this.el.offsetWidth; // restart the CSS animation
      this.el.classList.add("click");
    }

    moveTo(x: number, y: number, o: { dur?: number; straight?: boolean } = {}) {
      const sx = this.x;
      const sy = this.y;
      const dx = x - sx;
      const dy = y - sy;
      const d = Math.hypot(dx, dy) || 1;
      const dur = o.dur ?? clamp(130 + d * 0.42, 165, 470);
      const bend = o.straight ? 0 : rand(-1, 1) * Math.min(140, d * 0.3);
      const cx = (sx + x) / 2 - (dy / d) * bend;
      const cy = (sy + y) / 2 + (dx / d) * bend;
      this.vx = this.vy = 0;
      return tween(dur, (k) => {
        const e = ease(k);
        const u = 1 - e;
        this.x = u * u * sx + 2 * u * e * cx + e * e * x;
        this.y = u * u * sy + 2 * u * e * cy + e * e * y;
      });
    }

    drift(dt: number, t: number, idleMode: IdleMode, ringTarget: { x: number; y: number; w: number; h: number } | null) {
      let tx: number;
      let ty: number;
      if (idleMode === "ring" && ringTarget) {
        const r = ringTarget;
        // Evenly spaced around the button: index over count, not a random phase.
        const a = (this.index / this.total) * Math.PI * 2 + t * 0.00035;
        tx = r.x + r.w / 2 + Math.cos(a) * (r.w / 2 + 52) - 4;
        ty = r.y + r.h / 2 + Math.sin(a) * (r.h / 2 + 30) - 7;
      } else if (idleMode === "drifter") {
        // slow sine currents sweep the screen; alternate lanes swim opposite ways
        const W = innerWidth, H = innerHeight;
        const lane = (this.index % 6) / 5; // six horizontal currents
        const speed = 0.034 + (this.index % 3) * 0.012; // virtual-ms → px
        const x0 = ((t * speed + this.index * 173) % (W + 240)) - 120;
        const dir = this.index % 2 ? -1 : 1;
        tx = dir > 0 ? x0 : W - x0;
        ty = H * 0.16 + lane * H * 0.66 + Math.sin(t * 0.0011 + this.phase + x0 * 0.011) * 44;
      } else if (idleMode === "radar") {
        // breathing elliptical ring around the portrait disc (rect cached by the engine)
        if (!ringTarget) { tx = this.x; ty = this.y; }
        else {
          const sweep = this.index / this.total;
          const R = ringTarget.w * 0.5 + 34 + Math.sin(t * 0.0016 + sweep * Math.PI * 2) * 22;
          const a = this.phase + t * 0.00042 * this.spin;
          tx = ringTarget.x + ringTarget.w / 2 + Math.cos(a) * R;
          ty = ringTarget.y + ringTarget.h / 2 + Math.sin(a) * R * 0.82;
        }
      } else if (idleMode === "shimmer") {
        // fixed grid cells across the viewport; a soft vertical wave sweeps column by column
        const col = this.index % 6, row = Math.floor(this.index / 6);
        const gx = innerWidth * (0.15 + (col * 0.7) / 5);
        const gy = innerHeight * (0.18 + row * 0.3);
        tx = gx + Math.sin(t * 0.0009 + this.phase) * 14;
        ty = gy + Math.sin(t * 0.0021 - (col + row) * 0.9) * 26;
      } else {
        let goal = this.wanderTarget;
        const stale =
          !goal ||
          t > this.wanderUntil ||
          goal.y < scrollY - 40 ||
          goal.y > scrollY + innerHeight + 40 ||
          Math.hypot(goal.x - this.x, goal.y - this.y) < 12;
        if (stale) {
          goal = { x: scrollX + rand(30, innerWidth - 40), y: scrollY + rand(70, innerHeight - 110) };
          this.wanderTarget = goal;
          this.wanderUntil = t + rand(1400, 3600);
        }
        tx = goal ? goal.x : this.x;
        ty = goal ? goal.y : this.y;
      }
      const k =
        idleMode === "wander" ? 2.6
        : idleMode === "drifter" ? 2.0
        : idleMode === "radar" ? 3.6
        : idleMode === "shimmer" ? 3.0
        : 7.5; // snappier spring, less float
      const max =
        idleMode === "wander" ? 760
        : idleMode === "ring" ? 900
        : idleMode === "radar" ? 420
        : 320;
      let dvx = (tx - this.x) * k;
      let dvy = (ty - this.y) * k;
      const m = Math.hypot(dvx, dvy);
      if (m > max) {
        dvx *= max / m;
        dvy *= max / m;
      }
      const s = Math.min(1, dt * 0.009);
      this.vx += (dvx - this.vx) * s;
      this.vy += (dvy - this.vy) * s;
      this.x += (this.vx * dt) / 1000;
      this.y += (this.vy * dt) / 1000;
    }

    render() {
      this.el.style.transform = `translate3d(${this.x.toFixed(1)}px,${this.y.toFixed(1)}px,0)`;
    }
  }

  const agents: Agent[] = [];
  const spawnAgents = () => {
    for (let i = 0; i < agentCount; i++) {
      const a = new Agent(i, agentCount);
      // Spawn scattered across the screen instead of bunching behind the ready card —
      // a fresh visitor taps Start and expects cursors, not a silent second of waiting
      a.squad = i % 3 === 0 ? "drifter" : i % 3 === 1 ? "radar" : "shimmer";
      a.x = rand(24, innerWidth - 48);
      a.y = rand(70, Math.max(90, innerHeight - 96));
      a.vx = 0;
      a.vy = 0;
      agents.push(a);
      void live(a);
    }
  };

  let idleMode: IdleMode = "wander";

  /* ---------------------------------------------------------------- blocks */
  type Item = { el: Element; wire: HTMLDivElement | null; done: Promise<void>; finish: () => void; parent: Item | null };
  type Block = { el: Element; items: Item[]; promise: Promise<void> | null; built: boolean };

  const items = new Map<Element, Item>();
  const blocks: Block[] = $$("[data-block]").map((el) => {
    const owned = [el, ...$$("[data-b]", el)].filter((x) => x.hasAttribute("data-b") && x.closest("[data-block]") === el);
    const blockItems = owned.map((e) => {
      let finish!: () => void;
      const done = new Promise<void>((r) => {
        finish = r;
      });
      const item: Item = { el: e, wire: null, done, finish, parent: null };
      items.set(e, item);
      return item;
    });
    return { el, items: blockItems, promise: null, built: false };
  });
  items.forEach((item) => {
    const holder = item.el.parentElement?.closest("[data-b]");
    item.parent = holder ? (items.get(holder) ?? null) : null;
  });

  const total = items.size;
  let done = 0;
  hud.total.textContent = String(total);
  const paintHud = () => {
    hud.done.textContent = String(done);
    hud.bar.style.width = `${(done / total) * 100}%`;
  };
  const setStatus = (s: string) => {
    hud.status.textContent = s;
  };

  /* ---------------------------------------------------------------- jobs */
  // Every build job carries the generation it was created in. A replay bumps the
  // generation, so jobs that are still in flight stop touching the DOM instead of
  // re-revealing blocks or dragging cursors to their old targets.
  let buildGeneration = 0;

  const queue: ((a: Agent) => Promise<void>)[] = [];
  const waiters: { a: Agent; res: (job: (a: Agent) => Promise<void>) => void }[] = [];

  const enqueue = (job: (a: Agent) => Promise<void>, at?: { x: number; y: number }, prefer?: Agent) => {
    if (waiters.length) {
      let best = 0;
      let bestD = Infinity;
      waiters.forEach((w, i) => {
        // Prefer the agent that asked for this job, otherwise the closest waiting agent.
        const d = prefer === w.a ? -1 : at ? Math.hypot(w.a.x - at.x, w.a.y - at.y) : 0;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      waiters.splice(best, 1)[0].res(job);
    } else {
      queue.push(job);
    }
  };

  const dispatch = (fn: (a: Agent) => Promise<void>, at?: { x: number; y: number }, prefer?: Agent) =>
    new Promise<void>((res) =>
      enqueue(
        async (a) => {
          try {
            await fn(a);
          } catch (err) {
            console.error(err);
          }
          res();
        },
        at,
        prefer,
      ),
    );

  const live = async (a: Agent) => {
    const gen = buildGeneration;
    for (;;) {
      if (gen !== buildGeneration) return; // retired by a replay
      const job = queue.shift() ?? (await new Promise<((a: Agent) => Promise<void>) | void>((res) => waiters.push({ a, res } as never)));
      if (!job) break;
      a.idle = false;
      await job(a);
      a.mode("arrow");
      a.idle = true;
    }
  };

  /* ---------------------------------------------------------------- wires */
  const makeWire = (r: { x: number; y: number; w: number; h: number }) => {
    const w = document.createElement("div");
    w.className = "wire" + (r.w < 46 ? " sm" : "");
    w.innerHTML = "<u></u><u></u><u></u><u></u><em></em>";
    w.style.cssText = `left:${r.x}px;top:${r.y}px;width:0;height:0`;
    stage.appendChild(w);
    return w;
  };

  const wireJob = async (a: Agent, item: Item) => {
    const gen = buildGeneration;
    const r = rectOf(item.el);
    await a.moveTo(r.x, r.y);
    if (gen !== buildGeneration) return; // a replay happened: this job is void
    a.mode("cross");
    const wire = (item.wire = makeWire(r));
    const label = wire.lastElementChild as HTMLElement;
    const sx = a.x;
    const sy = a.y;
    await tween(clamp(150 + Math.hypot(r.w, r.h) * 0.3, 190, 560), (k) => {
      if (gen !== buildGeneration) return;
      const e = ease(k);
      a.x = sx + r.w * e;
      a.y = sy + r.h * e;
      wire.style.width = `${r.w * e}px`;
      wire.style.height = `${r.h * e}px`;
      label.textContent = `${Math.round(r.w * e)} × ${Math.round(r.h * e)}`;
    });
    if (gen !== buildGeneration) {
      wire.remove();
      item.wire = null;
      return;
    }
    sound.tick();
    a.mode("arrow");
  };

  /* ---------------------------------------------------------------- typing */
  const splitChars = (el: Element) => {
    const original = el.innerHTML;
    const spans: HTMLSpanElement[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      const frag = document.createDocumentFragment();
      for (const ch of node.textContent ?? "") {
        const span = document.createElement("span");
        span.className = "ch";
        span.textContent = ch;
        frag.appendChild(span);
        spans.push(span);
      }
      node.replaceWith(frag);
    }
    return { original, spans };
  };

  const typeIn = async (el: Element, a: Agent, gen: number) => {
    if (gen !== buildGeneration) return; // a replay happened: do not reveal anything
    // Long paragraphs would create hundreds of nodes; only short copy gets typed.
    const text = (el.textContent ?? "").trim();
    if (text.length > 140) {
      el.classList.add("on");
      return;
    }
    const { original, spans } = splitChars(el);
    const n = spans.length;
    el.classList.add("on");
    let shown = 0;
    try {
      await tween(clamp(n * 15, 170, 980), (k) => {
        if (gen !== buildGeneration) return;
        const upto = Math.round(k * n);
        if (upto <= shown) return;
        for (let i = shown; i < upto; i++) spans[i].classList.add("v");
        shown = upto;
        const r = spans[upto - 1].getBoundingClientRect();
        if (r.height) {
          a.x = r.right + scrollX + 2;
          a.y = r.top + r.height / 2 + scrollY;
        }
        sound.tick();
      });
    } finally {
      el.innerHTML = original; // always restore, even if the tween is interrupted
    }
  };

  /* ---------------------------------------------------------------- build */
  const resolveJob = async (a: Agent, item: Item) => {
    const gen = buildGeneration;
    if (item.parent) await item.parent.done;
    if (gen !== buildGeneration) return; // a replay happened: this job is void
    const kind = item.el.getAttribute("data-b");
    const r = rectOf(item.el);
    if (kind === "text") {
      await a.moveTo(r.x + 3, r.y + Math.min(r.h / 2, 14));
      if (gen !== buildGeneration) return;
      a.mode("ibeam");
      item.wire?.classList.add("edit");
      await typeIn(item.el, a, gen);
    } else if (kind === "mega") {
      await a.moveTo(r.x + r.w * rand(0.2, 0.8), r.y + r.h * 0.5);
      if (gen !== buildGeneration) return;
      a.click();
      item.el.classList.add("on");
      sound.boom();
      const t = $<SVGTextElement>("text", item.el);
      if (t) void tween(1500, (k) => (t.style.strokeDashoffset = String(2400 * (1 - ease(k)))));
      await wait(260);
    } else {
      await a.moveTo(r.x + r.w * rand(0.25, 0.75), r.y + r.h * rand(0.3, 0.7));
      if (gen !== buildGeneration) return;
      a.click();
      item.el.classList.add("on");
      await wait(110);
    }
    if (gen !== buildGeneration) return;
    if (item.wire) {
      const w = item.wire;
      w.classList.add("out");
      setTimeout(() => w.remove(), 200);
      item.wire = null;
    }
    done++;
    paintHud();
    sound.pop(done / total);
    item.finish();
  };

  const buildBlock = (block: Block) => {
    if (block.promise) return block.promise;
    const gen = buildGeneration;
    return (block.promise = (async () => {
      const anchorOf = (item: Item) => {
        const r = rectOf(item.el);
        return { x: r.x, y: r.y };
      };
      const wires: Promise<void>[] = [];
      for (const item of block.items) {
        wires.push(dispatch((a) => wireJob(a, item), anchorOf(item)));
        await wait(42);
      }
      await Promise.all(wires);
      await wait(240);
      const resolves: Promise<void>[] = [];
      for (const item of block.items) {
        resolves.push(dispatch((a) => resolveJob(a, item), anchorOf(item)));
        await wait(64);
      }
      await Promise.all(resolves);
      if (gen !== buildGeneration) return; // a replay happened while this block was building
      block.built = true;
      if (heroBlocks.every((b) => b.built)) void ensurePicker();
      if (block.el.hasAttribute("data-finale")) void runFinale();
      if (!autoOn && blocks.every((b) => b.built)) {
        finished = true;
        setStatus("Done");
        paintPlayIcon();
      }
    })());
  };

  /* ---------------------------------------------------------------- accent picker */
  let pickerPromise: Promise<void> | null = null;
  const ensurePicker = () => (pickerPromise ??= pickColour());

  const pickColour = async () => {
    const anchorEl = $(".name");
    if (!anchorEl) return;
    const anchor = rectOf(anchorEl);
    const order = [...accentNames.filter((n) => n !== finalAccent), finalAccent];
    const popup = document.createElement("div");
    popup.className = "picker";
    popup.innerHTML = accentNames.map((n) => `<i data-n="${n}" style="background:${accents[n]}"></i>`).join("");
    popup.style.left = `${anchor.x + anchor.w + 18}px`;
    popup.style.top = `${anchor.y + 6}px`;
    stage.appendChild(popup);
    if (anchor.x + anchor.w + 18 + 170 > innerWidth) {
      popup.style.left = `${anchor.x}px`;
      popup.style.top = `${anchor.y + anchor.h + 12}px`;
    }
    await wait(60);
    popup.classList.add("show");
    await dispatch(
      async (a) => {
        for (const name of order) {
          const sw = $<HTMLElement>(`[data-n="${name}"]`, popup);
          if (!sw) continue;
          const r = rectOf(sw);
          await a.moveTo(r.x + r.w / 2, r.y + r.h / 2, { dur: name === finalAccent ? 520 : 260 });
          $$("i", popup).forEach((i) => i.classList.toggle("sel", i === sw));
          root.style.setProperty("--acc", accents[name]);
          if (name === finalAccent) root.classList.add("inked");
          sound.pop(name === finalAccent ? 0.95 : 0.35);
          await wait(name === finalAccent ? 260 : 420);
        }
        a.click();
        sound.chord();
        await wait(520);
      },
      { x: anchor.x + anchor.w, y: anchor.y },
      agents[2],
    );
    popup.classList.remove("show");
    setTimeout(() => popup.remove(), 260);
  };

  /* ---------------------------------------------------------------- tour */
  let started = false;
  let resumable = false;
  let touring = false;
  let finished = false;
  let autoOn = true;
  let cruising = false;
  let tourGeneration = 0;
  let manualUntil = 0;
  let startedAt = 0;

  const heroBlocks = blocks.filter((b) => b.el.closest(".hero"));
  const maxScroll = () => Math.max(0, root.scrollHeight - innerHeight);

  const scrollToY = (y: number, dur: number, generation: number) => {
    const from = scrollY;
    const to = clamp(y, 0, maxScroll());
    if (Math.abs(to - from) < 2) return Promise.resolve();
    return tween(dur, (k) => {
      if (generation !== tourGeneration) return;
      // the pointer is over a link/button: never scroll away underneath it
      if (performance.now() < manualUntil) return;
      scrollTo(0, from + (to - from) * ease(k));
    });
  };

  const tour = async () => {
    const mine = ++tourGeneration;
    const alive = () => mine === tourGeneration;
    touring = true;
    paintPlayIcon();
    for (let i = 0; i < blocks.length; ) {
      const vh = innerHeight;
      const top = rectOf(blocks[i].el).y;
      let j = i;
      let bottom = top + rectOf(blocks[i].el).h;
      while (j + 1 < blocks.length) {
        const next = blocks[j + 1].el;
        // a block marked data-break always starts a new build step
        if (next.hasAttribute("data-break")) break;
        const r = rectOf(next);
        if (r.y + r.h > top + vh - 62) break;
        j++;
        bottom = Math.max(bottom, r.y + r.h);
      }
      const groupHeight = bottom - top;
      const first = i === 0;
      const target = first ? 0 : groupHeight < vh - 120 ? top - Math.min((vh - 96 - groupHeight) / 2, vh * 0.16) : top - 24;
      const group = blocks.slice(i, j + 1).filter((b) => !b.built);
      if (group.length) {
        setStatus(first ? "Building" : "Touring");
        const distance = Math.abs(target - scrollY);
        const sc = scrollToY(target, clamp(distance * 1.5, 500, 1500), mine);
        await wait(first ? 0 : 320);
        if (!alive()) return;
        const builds = group.map((b, k) => wait(k * 130).then(() => buildBlock(b)));
        const tall = groupHeight > vh - 40 ? sc.then(() => wait(900)).then(() => scrollToY(bottom - vh + 110, 2600, mine)) : null;
        await Promise.all([sc, tall, ...builds]);
        if (!alive()) return;
        if (first) {
          await ensurePicker();
          if (!alive()) return;
        }
        await wait(first ? 950 : 620);
        if (!alive()) return;
      }
      i = j + 1;
    }
    if (scrollY < maxScroll() - 60) {
      await scrollToY(maxScroll(), 1300, mine);
      if (!alive()) return;
    }
    touring = false;
    finished = true;
    setStatus("Done");
    paintPlayIcon();
  };

  const handsOn = () => {
    if (!started || paused) return;
    if (finished) {
      if (cruising) {
        cruising = false;
        tourGeneration++;
        setStatus("Done");
      }
      return;
    }
    manualUntil = performance.now() + 1700;
    if (touring) {
      touring = false;
      tourGeneration++;
      setStatus("Manual");
      buildInView();
    }
  };

  /**
   * Build every block that intersects the viewport right now, in manual mode.
   * The IntersectionObserver only fires on intersection *changes*, and it fired long
   * before the page unlocked — so without this, turning auto-scroll off (or a replay
   * that clears the `visible` set) left the page permanently unbuilt.
   */
  const buildInView = () => {
    // the ready screen still hides every block — nothing may build before Start
    if (!started || !resumable || reducedMode) return;
    const vh = window.innerHeight;
    for (const b of blocks) {
      if (b.built) continue;
      const r = b.el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) void buildBlock(b);
    }
  };

  const cruise = async () => {
    const mine = ++tourGeneration;
    cruising = true;
    setStatus("Gliding");
    await scrollToY(0, 900, mine);
    await wait(450);
    if (mine !== tourGeneration) return;
    const d = maxScroll();
    await tween(d / 0.17, (k) => {
      if (mine === tourGeneration) scrollTo(0, d * k);
    });
    if (mine === tourGeneration) {
      cruising = false;
      setStatus("Done");
    }
  };

  const toggleAuto = () => {
    if (finished) {
      void cruise();
      return;
    }
    autoOn = !autoOn;
    hud.auto.classList.toggle("on", autoOn);
    manualUntil = 0;
    if (!autoOn) {
      if (touring) {
        touring = false;
        tourGeneration++;
      }
      buildInView();
    }
    if (started) setStatus(autoOn ? "Touring" : "Auto-scroll off");
  };

  /* ---------------------------------------------------------------- swarm */
  type Particle = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; k: number; c: string; s: number; ph: number };

  const swarm = {
    particles: [] as Particle[],
    active: false,
    current: null as { word: string; font: string } | null,
    dpr: 1,
    path: new Path2D("M0 0v15l4.2-3.8 2.8 6.6 2.4-1-2.8-6.5h5.6z"),
    mouse: { x: -999, y: -999, t: -9999 },
    size() {
      // Cap the device pixel ratio: a 3x phone screen would quadruple the fill cost.
      this.dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.floor(innerWidth * this.dpr);
      canvas.height = Math.floor(innerHeight * this.dpr);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
    },
    clear() {
      // Wipe the canvas: without this the last swarm frame stays painted over
      // whatever the page shows next.
      this.active = false;
      this.particles = [];
      this.current = null;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    points(word: string, count: number, w: number, h: number, font: string) {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.floor(w));
      c.height = Math.max(1, Math.floor(h));
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return [] as [number, number][];
      ctx.fillStyle = "#fff";
      if (word === "♥") {
        // A symmetric heart from two cubic lobes, centred in the stage box.
        const s = Math.min((w * 0.26) / 52, (h * 0.62) / 50);
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(s, s);
        ctx.translate(0, -19); // the heart spans y -6..44
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.bezierCurveTo(-10, -6, -26, -2, -26, 12);
        ctx.bezierCurveTo(-26, 26, -12, 32, 0, 44);
        ctx.bezierCurveTo(12, 32, 26, 26, 26, 12);
        ctx.bezierCurveTo(26, -2, 10, -6, 0, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        let fs = h * 1.04;
        ctx.font = `900 ${fs}px ${font}`;
        const m = ctx.measureText(word);
        if (m.width > w * 0.9) {
          fs *= (w * 0.9) / m.width;
          ctx.font = `900 ${fs}px ${font}`;
        }
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        const mm = ctx.measureText(word);
        ctx.fillText(word, w / 2, h / 2 + mm.actualBoundingBoxAscent / 2 - 6);
      }
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      // Count the ink first: the step must come from the drawn area, not the canvas
      // area, or every letter gets a pile of particles on top of itself.
      let ink = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 128) ink++;
      const pts: [number, number][] = [];
      const step = Math.max(2, Math.sqrt(ink / Math.max(1, count)) * 0.98);
      for (let py = step / 2, row = 0; py < c.height; py += step, row++) {
        for (let px = row % 2 ? step / 2 : 0; px < c.width; px += step) {
          if (data[((py | 0) * c.width + (px | 0)) * 4 + 3] > 128) pts.push([px, py]);
        }
      }
      for (let i = pts.length - 1; i > 0; i--) {
        const k = Math.floor(Math.random() * (i + 1));
        [pts[i], pts[k]] = [pts[k], pts[i]];
      }
      return pts;
    },
    shape(word: string, font: string, impulse = true) {
      const stageEl = $("#swarmStage");
      if (!stageEl) return;
      const r = stageEl.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      if (w < 10 || h < 10) return;
      this.current = { word, font };
      const pts = this.points(word, this.particles.length, w, h, font);
      this.particles.forEach((p, i) => {
        const target = pts[i % Math.max(1, pts.length)] ?? [w / 2, h / 2];
        p.tx = target[0];
        p.ty = target[1];
        if (impulse) {
          p.vx += rand(-420, 420);
          p.vy += rand(-420, 420);
        }
      });
    },
    async play(words: string[], font: string) {
      this.size();
      const mobile = innerWidth < 700;
      // density, not area, is what makes the word readable on small screens —
      // 260 dots cannot spell LET'S BUILD; scale with viewport width
      const count = Math.round(clamp(innerWidth * (mobile ? 1.15 : 0.42), 380, 640));
      const W = innerWidth;
      const H = innerHeight;
      this.particles = [];
      for (let i = 0; i < count; i++) {
        const side = Math.floor(rand(4));
        const x = side === 0 ? -30 : side === 1 ? W + 30 : rand(W);
        const y = side === 2 ? -30 : side === 3 ? H + 30 : rand(H);
        this.particles.push({
          x,
          y,
          vx: 0,
          vy: 0,
          tx: 0,
          ty: 0,
          k: rand(20, 46),
          c: HUES[i % HUES.length],
          s: mobile ? rand(0.42, 0.56) : rand(0.46, 0.64),
          ph: rand(6.28),
        });
      }
      this.active = true;
      for (let i = 0; i < words.length; i++) {
        this.shape(words[i], font);
        sound.whoosh();
        if (i === words.length - 1) {
          await wait(700);
          sound.chord();
          idleMode = "ring";
          stage.classList.add("ring");
          break;
        }
        await wait(i === 0 ? 2300 : 1700);
      }
    },
    step(dt: number, t: number) {
      if (!this.active) return;
      const stageEl = $("#swarmStage");
      if (!stageEl) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const r = stageEl.getBoundingClientRect();
      const h = Math.min(0.032, (dt / 1000) * Math.max(1, speed * 0.8));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of this.particles) {
        const tx = r.left + p.tx + Math.sin(t * 0.002 + p.ph) * 1.6;
        const ty = r.top + p.ty + Math.cos(t * 0.0017 + p.ph) * 1.6;
        let ax = (tx - p.x) * p.k - p.vx * 8.2;
        let ay = (ty - p.y) * p.k - p.vy * 8.2;
        const mx = p.x - this.mouse.x;
        const my = p.y - this.mouse.y;
        const md = mx * mx + my * my;
        if (md < 9000 && t - this.mouse.t < 2200) {
          const f = ((9000 - md) * 0.9) / (Math.sqrt(md) + 1);
          ax += mx * f;
          ay += my * f;
        }
        p.vx += ax * h;
        p.vy += ay * h;
        p.x += p.vx * h;
        p.y += p.vy * h;
        ctx.setTransform(this.dpr * p.s, 0, 0, this.dpr * p.s, p.x * this.dpr, p.y * this.dpr);
        ctx.fillStyle = p.c;
        ctx.fill(this.path);
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = "rgba(255,255,255,.85)";
        ctx.stroke(this.path);
      }
    },
  };

  let finaleRan = false;
  const runFinale = async () => {
    if (finaleRan) return;
    finaleRan = true;
    await wait(350);
    const nameEl = $(".name");
    const font = nameEl ? getComputedStyle(nameEl).fontFamily : "sans-serif";
    await swarm.play(finale, font);
  };

  /* ---------------------------------------------------------------- hud + input */
  const playIcon = hud.play.querySelector<SVGElement>("#icoPlay");
  const paintPlayIcon = () => {
    const running = started && !paused && !finished;
    if (playIcon) playIcon.innerHTML = finished ? REPLAY_ICON : running ? PAUSE_ICON : PLAY_ICON;
  };

  const visible = new Set<Block>();
  let reducedMode = false;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const block = blocks.find((b) => b.el === entry.target);
        if (!block) continue;
        if (entry.isIntersecting) {
          visible.add(block);
          // `resumable` is only true once the ready card has faded out, so the
          // cursors never build behind the profile picture.
          if (started && !touring && !reducedMode && resumable) void buildBlock(block);
        } else {
          visible.delete(block);
        }
      }
    },
    { threshold: 0.12 },
  );
  blocks.forEach((b) => observer.observe(b.el));

  const start = async () => {
    if (started) return;
    const gen = buildGeneration; // an in-flight replay voids this run
    started = true;
    startedAt = performance.now();
    stage.classList.remove("prelaunch"); // the build claims the screen
    idleMode = "wander"; // cursors roam the whole screen during the scan, not after the fade
    root.classList.add("nocursor");
    // aim the first cursors at the hero right away, so the fade reveals them on station
    heroBlocks.slice(0, 6).forEach((hb, i) => {
      const a = agents[i];
      if (!a) return;
      const r = rectOf(hb.el);
      a.wanderTarget = { x: r.x + r.w * rand(0.25, 0.75), y: r.y + Math.min(r.h / 2, 26) };
      a.wanderUntil = performance.now() + 1e10;
    });
    root.classList.remove("locked");
    scrollTo(0, 0);
    paintPlayIcon();
    setStatus("Scanning page…");
    bootNote.style.opacity = "0";
    void sound.unlock().then(() => sound.whoosh()); // single resume, whoosh plays exactly once
    const scan = $<HTMLElement>(".scan");
    if (scan) {
      scan.style.opacity = "1";
      await tween(820, (k) => {
        if (gen === buildGeneration) scan.style.transform = `translateY(${ease(k) * innerHeight}px)`;
      });
      scan.style.opacity = "0";
    }
    if (gen !== buildGeneration) return; // a replay happened while the scan was running
    boot.classList.add("off"); // the profile card fades out first
    await wait(420); // ...and only then do the cursors start building
    if (gen !== buildGeneration) return;
    resumable = true;
    if (autoOn) {
      void tour();
    } else {
      // manual mode: build the hero now, the rest as the user scrolls
      setStatus("Building");
      buildInView();
    }
  };

  /**
   * Rebuild the page from the very beginning — no reload.
   *
   * A reload re-renders the document (which reads as "the hero rendered twice") and it
   * loses the scroll position mid-build. This wipes every bit of engine state, brings the
   * Ready screen back and starts the build again from the first block.
   */
  const reset = async () => {
    tourGeneration++; // kill the tour that is still running
    buildGeneration++; // void every job that is still in flight
    timers.clear(); // no old wait/tween may fire into the new run
    tweens.clear();
    queue.length = 0; // ...and drop the ones that never started
    waiters.length = 0; // ...and any agent still waiting for one
    pickerPromise = null; // the colour picker walks again on the rebuilt page
    // undo any half-done typewriter: merge the .ch spans back into plain text
    $$(".ch").forEach((span) => {
      span.replaceWith(document.createTextNode(span.textContent ?? ""));
    });
    touring = false;
    cruising = false;
    paused = false;
    finaleRan = false;
    swarm.clear(); // the old swarm frame must not stay on the canvas
    const scanEl = $<HTMLElement>(".scan");
    if (scanEl) {
      scanEl.style.opacity = "0";
      scanEl.style.transform = "translateY(0px)";
    }
    bootNote.style.opacity = "";
    $$(".wire", stage).forEach((w) => w.remove());
    stage.classList.remove("ring");
    stage.classList.add("prelaunch"); // Ready screen: labels hidden until Start again
    // every cursor goes away and re-enters spawned fresh - no cursor remembers a half-finished job
    // so no cursor is ever stuck holding a half-finished job from the old run
    agents.length = 0;
    stage.replaceChildren();
    spawnAgents();
    blocks.forEach((b) => {
      b.built = false;
      b.promise = null;
    });
    // fresh promises so the rebuild starts from the top of the order again
    items.forEach((item) => {
      let finish!: () => void;
      const done = new Promise<void>((r) => {
        finish = r;
      });
      item.done = done;
      item.finish = finish;
      item.wire = null;
    });
    $$("[data-b]").forEach((el) => el.classList.remove("on"));
    const megaText = $<SVGTextElement>(".mega text");
    if (megaText) megaText.style.strokeDashoffset = "2400";
    done = 0;
    paintHud();
    visible.clear();
    started = false;
    finished = false;
    autoOn = true;
    manualUntil = 0;
    resumable = false;
    hud.auto.classList.add("on");
    idleMode = "wander";
    // the accent returns to the CSS default (the fresh-load value), the disc goes grey
    // again, and the picker walks its colours from the top on the rebuilt page
    root.style.setProperty("--acc", "");
    root.classList.remove("inked");
    scrollTo(0, 0);
    // the Ready screen comes back, then the build runs again from the top
    boot.classList.remove("off");
    bootNote.style.opacity = "";
    setStatus("Ready");
    paintPlayIcon();
    const gen = buildGeneration;
    await wait(450); // brief beat for the fade; the build starts immediately after
    if (gen !== buildGeneration) return; // another replay happened in the meantime
    if (!started) await start();
  };

  const toggle = () => {
    if (finished) {
      void reset();
      return;
    }
    if (!started) {
      void start();
      return;
    }
    paused = !paused;
    if (!paused) sound.unlock();
    setStatus(paused ? "Paused" : touring ? "Touring" : autoOn ? "Manual" : "Auto-scroll off");
    paintPlayIcon();
  };

  const replay = () => {
    // Rebuild in place: a page reload would re-render the whole document.
    void reset();
  };

  const setSpeed = (s: number) => {
    speed = s;
    hud.speed.textContent = `${s}x`;
  };

  const toggleSound = () => {
    sound.on = !sound.on;
    if (sound.on) sound.unlock();
    hud.sound.classList.toggle("off", !sound.on);
  };

  const onTour = (e: Event) => {
    e.stopPropagation();
    toggle();
  };
  const onAuto = (e: Event) => {
    e.stopPropagation();
    toggleAuto();
  };
  const onSpeed = (e: Event) => {
    e.stopPropagation();
    setSpeed(speed >= 2 ? 0.5 : speed >= 1 ? 2 : 1);
  };
  const onSound = (e: Event) => {
    e.stopPropagation();
    toggleSound();
  };
  const onReplay = (e: Event) => {
    e.stopPropagation();
    replay();
  };

  hud.play.addEventListener("click", onTour);
  hud.auto.addEventListener("click", onAuto);
  hud.speed.addEventListener("click", onSpeed);
  hud.sound.addEventListener("click", onSound);
  hud.replay.addEventListener("click", onReplay);

  const wake = () => {
    // every gesture nudges the resume — sounds stay quiet until the scan whoosh needs them
    sound.unlock();
  };
  const onPointerDown = () => {
    onPointerDock();
    wake();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    wake();
    const k = e.key.toLowerCase();
    if (k === " ") {
      e.preventDefault();
      toggle();
    } else if (k === "r") replay();
    else if (k === "m") toggleSound();
    else if (k === "a") toggleAuto();
    else if (k === "h") root.classList.toggle("clean");
    else if (k === "1") setSpeed(1);
    else if (k === "2") setSpeed(2);
    else if (k === "3") setSpeed(0.5);
    else if (k === "c") {
      const order = accentNames;
      const next = order[(order.indexOf(finalAccent) + 1) % order.length];
      root.style.setProperty("--acc", accents[next]);
      root.classList.add("inked");
    } else if (["arrowdown", "arrowup", "pagedown", "pageup", "home", "end"].includes(k)) handsOn();
  };
  const onPointerMove = (e: PointerEvent) => {
    swarm.mouse.x = e.clientX;
    swarm.mouse.y = e.clientY;
    swarm.mouse.t = performance.now();
    root.classList.remove("nocursor");
    // the tour scrolls the page; never scroll away underneath the pointer
    if ((e.target as Element | null)?.closest("a,button,input,select,textarea,label")) {
      manualUntil = performance.now() + 2000;
    }
  };
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    // any tap/click except on the HUD itself starts the build — on a phone the
    // ready card is where the thumb lands, so it must not be excluded
    if (!started && !target?.closest(".hud")) void start();
  };
  const onWheel = () => {
    // Scrolling never starts the build: Space, the Start button and the HUD play
    // are the only ways in, so all three behave the same way.
    if (started) handsOn();
  };
  const onTouchMove = () => {
    if (started) {
      // touch momentum keeps the page moving after the finger lifts; hold the tour
      // for longer than a wheel, or the tour starts dragging the page mid-gesture
      manualUntil = performance.now() + 3000;
      handsOn();
    }
  };
  // while a finger is down we never re-arm the tour — the user is scrolling or tapping
  let pointerIsDown = false;
  const onPointerUndock = () => {
    pointerIsDown = false;
  };
  const onPointerDock = () => {
    pointerIsDown = true;
  };
  // tap-to-start must fire on the very first gesture, not after the ~300ms click latency
  const onTouchStart = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest(".hud")) return; // let HUD buttons handle themselves
    if (!started) void start();
  };
  const onResize = () => {
    swarm.size();
    // Re-fit the letters to the new stage: the word must follow the screen size.
    if (swarm.active && swarm.current) swarm.shape(swarm.current.word, swarm.current.font, false);
  };

  addEventListener("pointerdown", onPointerDown, true);
  addEventListener("pointerdown", onTouchStart, true);
  addEventListener("pointerup", onPointerUndock, true);
  addEventListener("pointercancel", onPointerUndock, true);
  addEventListener("keydown", onKeyDown, true);
  addEventListener("pointermove", onPointerMove);
  addEventListener("click", onClick);
  addEventListener("wheel", onWheel, { passive: true });
  addEventListener("touchmove", onTouchMove, { passive: true });
  addEventListener("resize", onResize);

  /* ---------------------------------------------------------------- loop */
  let last = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    // The clock follows wall time, not the frame count: on a slow device the
    // animation plays at fewer frames but the build still takes the same time.
    const elapsed = now - last;
    const dt = Math.min(50, elapsed); // capped step for the physics/drift only
    last = now;
    if (document.hidden) return; // nothing to draw while the tab is hidden
    if (!paused) {
      vt += elapsed * speed;
      for (const timer of [...timers]) {
        if (vt >= timer.t) {
          timers.delete(timer);
          timer.res();
        }
      }
      for (const tw of [...tweens]) {
        const k = Math.min(1, (vt - tw.t0) / tw.dur);
        tw.fn(k);
        if (k >= 1) {
          tweens.delete(tw);
          tw.res();
        }
      }
      // pre-start each cursor walks its squad pattern; one DOM read per frame, never per agent
      const pre = !started;
      const discEl = pre ? $(".pwrap .disc") : null;
      const discRect = discEl ? rectOf(discEl) : null;
      const contactEl = !pre ? $(".contact .btn.pri") : null;
      const contactRect = contactEl ? rectOf(contactEl) : null;
      for (const a of agents) {
        if (a.idle) a.drift(dt * Math.min(2, speed), now, pre ? a.squad : idleMode, pre ? discRect : contactRect);
      }
    }
    for (const a of agents) a.render();
    swarm.step(paused ? 0 : dt, now);
    hud.sound.classList.toggle("want", sound.on && (!sound.ctx || sound.ctx.state !== "running"));
    if (resumable && !touring && !finished && !paused && autoOn && !pointerIsDown && now > manualUntil) void tour();
  };

  /* ---------------------------------------------------------------- boot */
  const displayFont = (() => {
    const el = $(".name");
    return el ? getComputedStyle(el).fontFamily : "sans-serif";
  })();

  // Fit the outlined word to its own glyph box so it runs edge to edge.
  const fitMega = () => {
    const svg = $(".mega");
    const t = svg ? $("text", svg) : null;
    if (!svg || !t) return;
    const c = document.createElement("canvas").getContext("2d");
    if (!c) return;
    c.font = `900 300px ${displayFont}`;
    const m = c.measureText(t.textContent ?? "");
    const asc = m.actualBoundingBoxAscent || 215;
    const wd = m.width || 1300;
    svg.setAttribute("viewBox", `-3 -3 ${wd + 6} ${asc + 6}`);
    t.setAttribute("x", "0");
    t.setAttribute("y", String(asc));
  };

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  fitMega();
  swarm.size();
  setSpeed(speed);
  paintHud();
  hud.agents.textContent = String(agentCount);
  hud.sound.classList.toggle("off", !sound.on);

  spawnAgents();
  scrollTo(0, 0); // browsers restore the last scroll position on reload — the ready screen always opens at the top
  stage.classList.add("prelaunch"); // labels stay hidden until the user taps Start

  if (reduced) {
    // Reduced motion: show the finished page, keep the controls available.
    reducedMode = true;
    started = true;
    finished = true;
    root.classList.remove("locked");
    stage.classList.remove("prelaunch");
    boot.classList.add("off");
    root.style.setProperty("--acc", accents[finalAccent]);
    root.classList.add("inked");
    blocks.forEach((b) => (b.built = true));
    $$("[data-b]").forEach((el) => el.classList.add("on"));
    const t = $<SVGTextElement>(".mega text");
    if (t) t.style.strokeDashoffset = "0";
    done = total;
    paintHud();
    setStatus("Built");
    idleMode = "wander";
    paintPlayIcon();
  } else {
    setStatus("Ready");
    paintPlayIcon();
  }

  raf = requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });

  // dev-only diagnostics: read the engine state from the console
  if (process.env.NODE_ENV !== "production") {
    (window as unknown as { __engine?: unknown }).__engine = {
      get state() {
        return {
          started,
          paused,
          finished,
          touring,
          autoOn,
          vt: Math.round(vt),
          speed,
          timers: timers.size,
          tweens: tweens.size,
          blocks: blocks.length,
          built: blocks.filter((b) => b.built).length,
          agents: agents.length,
        };
      },
    };
  }

  /* ---------------------------------------------------------------- teardown */
  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    timers.clear();
    tweens.clear();
    hud.play.removeEventListener("click", onTour);
    hud.auto.removeEventListener("click", onAuto);
    hud.speed.removeEventListener("click", onSpeed);
    hud.sound.removeEventListener("click", onSound);
    hud.replay.removeEventListener("click", onReplay);
    removeEventListener("pointerdown", onPointerDown, true);
    removeEventListener("pointerdown", onTouchStart, true);
    removeEventListener("pointerup", onPointerUndock, true);
    removeEventListener("pointercancel", onPointerUndock, true);
    removeEventListener("keydown", onKeyDown, true);
    removeEventListener("pointermove", onPointerMove);
    removeEventListener("click", onClick);
    removeEventListener("wheel", onWheel);
  removeEventListener("touchmove", onTouchMove);
    removeEventListener("resize", onResize);
    stage.replaceChildren();
    sound.close();
  };
}

