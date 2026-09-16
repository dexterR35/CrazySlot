import { useEffect, useRef, useState } from 'react';
import 'pixi.js/unsafe-eval';
import { Application, Container, Graphics, Rectangle, Sprite, Text, TextStyle } from 'pixi.js';
import { PAYLINES, REEL_STRIPS, SYMBOLS } from '../game/slotMath.js';

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 600;
const REEL_X = 100;
const REEL_Y = 34;
const REEL_WIDTH = 152;
const REEL_GAP = 10;
const CELL_HEIGHT = 140;
const REEL_HEIGHT = CELL_HEIGHT * 3;
const LINE_COLORS = [0xffd35a, 0x50e7ff, 0xff5570, 0x78ff9b, 0xd884ff, 0xff9e45];
const ROW_KEY = { '-1': 'top', 0: 'center', 1: 'bottom' };

const mod = (value, length) => ((value % length) + length) % length;
const smootherStep = (value) => value ** 3 * (value * (value * 6 - 15) + 10);

function addText(parent, text, options, x, y, anchor = 0.5) {
  const label = new Text({ text, style: new TextStyle(options) });
  label.anchor.set(anchor);
  label.position.set(x, y);
  parent.addChild(label);
  return label;
}

function buildSymbol(symbolKey) {
  const symbol = SYMBOLS[symbolKey];
  const card = new Container();
  const color = Number.parseInt(symbol.color.slice(1), 16);
  const glow = Number.parseInt(symbol.glow.slice(1), 16);

  const shadow = new Graphics()
    .roundRect(9, 11, REEL_WIDTH - 18, CELL_HEIGHT - 14, 16)
    .fill({ color: 0x090307, alpha: 0.55 });
  const base = new Graphics()
    .roundRect(7, 7, REEL_WIDTH - 14, CELL_HEIGHT - 14, 16)
    .fill({ color: 0x2a0b10, alpha: 0.98 })
    .roundRect(7, 7, REEL_WIDTH - 14, CELL_HEIGHT - 14, 16)
    .stroke({ color: 0x8f4b2a, width: 2, alpha: 0.7 })
    .roundRect(14, 14, REEL_WIDTH - 28, CELL_HEIGHT - 28, 12)
    .fill({ color: 0x4a1118, alpha: 0.92 });
  const halo = new Graphics().circle(REEL_WIDTH / 2, 76, 56).fill({ color: glow, alpha: 0.07 });
  card.addChild(shadow, base, halo);

  if (symbolKey === 'mega') {
    const coin = new Graphics()
      .circle(REEL_WIDTH / 2, 73, 54).fill({ color: 0x7f3f0e })
      .circle(REEL_WIDTH / 2, 73, 49).fill({ color: 0xf5b82f })
      .circle(REEL_WIDTH / 2, 73, 40).fill({ color: 0xb96612 })
      .circle(REEL_WIDTH / 2, 73, 35).stroke({ color: 0xffef9b, width: 3 });
    card.addChild(coin);
    addText(card, 'MEGA', { fontFamily: 'Georgia', fontSize: 29, fontWeight: '900', fill: 0x55160c, stroke: { color: 0xffe783, width: 2 } }, REEL_WIDTH / 2, 74);
  } else if (symbolKey === 'wild') {
    const paper = new Graphics()
      .poly([25, 30, 137, 24, 131, 121, 21, 130]).fill({ color: 0xe5be79 })
      .poly([25, 30, 137, 24, 131, 121, 21, 130]).stroke({ color: 0x6b321c, width: 4 });
    card.addChild(paper);
    addText(card, 'WANTED', { fontFamily: 'Georgia', fontSize: 15, fontWeight: '900', fill: 0x522316, letterSpacing: 3 }, REEL_WIDTH / 2, 46);
    addText(card, 'WILD', { fontFamily: 'Georgia', fontSize: 38, fontWeight: '900', fill: 0x3b170f, stroke: { color: 0xffdf91, width: 1 } }, REEL_WIDTH / 2, 79);
    addText(card, '$ 1,000', { fontFamily: 'Arial', fontSize: 12, fontWeight: '800', fill: 0x68311c }, REEL_WIDTH / 2, 111);
  } else if (symbolKey === 'dynamite') {
    const tnt = new Graphics();
    [42, 68, 94].forEach((x) => {
      tnt.roundRect(x, 39, 28, 86, 6).fill({ color: 0xd92b24 }).roundRect(x + 6, 44, 8, 76, 4).fill({ color: 0xff5b45, alpha: 0.62 });
    });
    tnt.roundRect(35, 68, 94, 30, 3).fill({ color: 0xe5b44e }).roundRect(35, 68, 94, 30, 3).stroke({ color: 0x6b2417, width: 3 });
    tnt.moveTo(84, 39).bezierCurveTo(82, 17, 120, 27, 122, 9).stroke({ color: 0xf7c85a, width: 4 });
    tnt.star(124, 10, 7, 14, 5).fill({ color: 0xffed81 });
    card.addChild(tnt);
    addText(card, 'TNT', { fontFamily: 'Arial Black', fontSize: 25, fontWeight: '900', fill: 0x5c160f }, REEL_WIDTH / 2, 83);
  } else if (symbolKey === 'whiskey') {
    const bottle = new Graphics()
      .roundRect(70, 26, 31, 24, 5).fill({ color: 0x6e3211 })
      .roundRect(49, 44, 73, 91, 18).fill({ color: 0x8f4713 })
      .roundRect(57, 49, 22, 77, 10).fill({ color: 0xe99a27, alpha: 0.42 })
      .roundRect(44, 71, 83, 42, 5).fill({ color: 0xd6a657 })
      .roundRect(44, 71, 83, 42, 5).stroke({ color: 0x5c2a15, width: 3 });
    card.addChild(bottle);
    addText(card, 'XXX', { fontFamily: 'Georgia', fontSize: 24, fontWeight: '900', fill: 0x5d2712 }, REEL_WIDTH / 2, 92);
  } else if (symbolKey === 'sheriff') {
    const star = new Graphics()
      .star(REEL_WIDTH / 2, 77, 6, 62, 30).fill({ color: 0xeebc42 })
      .star(REEL_WIDTH / 2, 77, 6, 62, 30).stroke({ color: 0xffee9d, width: 3 })
      .circle(REEL_WIDTH / 2, 77, 23).fill({ color: 0x9b5416 })
      .circle(REEL_WIDTH / 2, 77, 18).stroke({ color: 0xffe16c, width: 2 });
    card.addChild(star);
    addText(card, '★', { fontSize: 25, fill: 0xffe77d }, REEL_WIDTH / 2, 76);
  } else if (symbolKey === 'boot') {
    const boot = new Graphics()
      .poly([57, 25, 108, 25, 104, 86, 127, 103, 129, 125, 38, 125, 34, 109, 62, 91]).fill({ color: 0x2f9eb4 })
      .poly([57, 25, 108, 25, 104, 86, 127, 103, 129, 125, 38, 125, 34, 109, 62, 91]).stroke({ color: 0x9bf0ff, width: 3 });
    card.addChild(boot);
    addText(card, '♠', { fontFamily: 'Georgia', fontSize: 34, fill: 0x173e54 }, 83, 66);
  } else if (symbolKey === 'skull') {
    addText(card, '☠', { fontFamily: 'Georgia', fontSize: 88, fontWeight: '900', fill: color, stroke: { color: 0x416e60, width: 3 }, dropShadow: { color: glow, alpha: 0.5, blur: 8, distance: 0 } }, REEL_WIDTH / 2, 75);
  } else {
    addText(card, symbol.label, { fontFamily: 'Georgia', fontSize: 92, fontWeight: '900', fontStyle: 'italic', fill: color, stroke: { color: glow, width: 3 }, dropShadow: { color, alpha: 0.48, blur: 12, distance: 0 } }, REEL_WIDTH / 2, 75);
    addText(card, symbolKey === 'ace' ? '♦' : '♣', { fontFamily: 'Georgia', fontSize: 25, fill: glow }, 120, 106);
  }

  addText(card, symbol.name.toUpperCase(), { fontFamily: 'Arial', fontSize: 8, fontWeight: '800', fill: 0xe6c6a0, letterSpacing: 1.2 }, REEL_WIDTH / 2, 131);
  return card;
}

function createPixiScene(app, playTone) {
  const root = app.stage;
  const bankWidth = REEL_WIDTH * 5 + REEL_GAP * 4;
  const backdrop = new Graphics()
    .rect(0, 0, VIEW_WIDTH, VIEW_HEIGHT).fill({ color: 0x120307, alpha: 0.99 })
    .roundRect(REEL_X - 16, REEL_Y - 16, bankWidth + 32, REEL_HEIGHT + 32, 20).fill({ color: 0x090205 })
    .roundRect(REEL_X - 16, REEL_Y - 16, bankWidth + 32, REEL_HEIGHT + 32, 20).stroke({ color: 0x4e100e, width: 12 })
    .roundRect(REEL_X - 10, REEL_Y - 10, bankWidth + 20, REEL_HEIGHT + 20, 15).stroke({ color: 0xe2a548, width: 4 })
    .roundRect(230, 500, 540, 82, 16).fill({ color: 0x26080c, alpha: 0.95 })
    .roundRect(230, 500, 540, 82, 16).stroke({ color: 0x6b2318, width: 3 });
  [[24, 24], [976, 24], [24, 576], [976, 576]].forEach(([x, y]) => {
    backdrop.circle(x, y, 7).fill({ color: 0xd69a42 }).circle(x - 2, y - 2, 2).fill({ color: 0xffe392 });
  });
  root.addChild(backdrop);

  const symbolTextures = Object.fromEntries(Object.keys(SYMBOLS).map((symbolKey) => {
    const artwork = buildSymbol(symbolKey);
    const texture = app.renderer.generateTexture({
      target: artwork,
      frame: new Rectangle(0, 0, REEL_WIDTH, CELL_HEIGHT),
      resolution: Math.min(app.renderer.resolution || 1, 1.5),
      antialias: true,
    });
    artwork.destroy({ children: true });
    return [symbolKey, texture];
  }));

  const reels = REEL_STRIPS.map((strip, reelIndex) => {
    const reel = new Container();
    reel.position.set(REEL_X + reelIndex * (REEL_WIDTH + REEL_GAP), REEL_Y);
    const well = new Graphics().rect(0, 0, REEL_WIDTH, REEL_HEIGHT).fill({ color: reelIndex % 2 ? 0x27070b : 0x31090e });
    const mask = new Graphics().rect(0, 0, REEL_WIDTH, REEL_HEIGHT).fill(0xffffff);
    const content = new Container();
    reel.addChild(well, content, mask);
    content.mask = mask;
    root.addChild(reel);

    const cards = [-1, 0, 1, 2, 3].map(() => {
      const holder = new Container();
      const sprite = new Sprite(symbolTextures.king);
      sprite.anchor.set(0.5);
      sprite.position.set(REEL_WIDTH / 2, CELL_HEIGHT / 2);
      content.addChild(holder);
      holder.addChild(sprite);
      return { holder, sprite, symbolKey: '' };
    });
    return { strip, reel, content, cards, position: mod(-reelIndex * 2, strip.length), bounce: 0, done: true };
  });

  const separators = new Graphics();
  for (let row = 1; row < 3; row += 1) {
    separators.moveTo(REEL_X, REEL_Y + row * CELL_HEIGHT).lineTo(VIEW_WIDTH - REEL_X, REEL_Y + row * CELL_HEIGHT);
  }
  separators.stroke({ color: 0xd99646, width: 2, alpha: 0.28 });
  root.addChild(separators);

  const shine = new Graphics().poly([0, REEL_Y, 120, REEL_Y, 430, REEL_Y + REEL_HEIGHT, 310, REEL_Y + REEL_HEIGHT]).fill({ color: 0xffffff, alpha: 0.035 });
  root.addChild(shine);

  const winGraphics = new Graphics();
  root.addChild(winGraphics);
  const winLabelBack = new Graphics().roundRect(245, 510, 510, 58, 12).fill({ color: 0x130408, alpha: 0.96 }).roundRect(245, 510, 510, 58, 12).stroke({ color: 0xf0bd59, width: 2, alpha: 0.8 });
  winLabelBack.visible = false;
  root.addChild(winLabelBack);
  const winLabel = addText(root, '', { fontFamily: 'Arial', fontSize: 15, fontWeight: '900', fill: 0xffe3a0, letterSpacing: 1 }, VIEW_WIDTH / 2, 539);
  winLabel.visible = false;

  const particles = new Container();
  root.addChild(particles);
  const state = { active: false, reels, wins: [], result: null, cycleStart: 0, activeWin: -1, particleData: [] };

  function refreshReel(reelData) {
    const base = Math.floor(reelData.position);
    const fraction = reelData.position - base;
    reelData.cards.forEach((card, cardIndex) => {
      const offset = cardIndex - 1;
      const symbolIndex = mod(-(base + offset), reelData.strip.length);
      const symbolKey = reelData.strip[symbolIndex];
      if (card.symbolKey !== symbolKey) {
        card.sprite.texture = symbolTextures[symbolKey];
        card.symbolKey = symbolKey;
      }
      card.holder.y = (offset + 1 - fraction) * CELL_HEIGHT + reelData.bounce;
    });
  }

  reels.forEach(refreshReel);

  function burst(amount) {
    const count = Math.min(90, 28 + Math.floor(amount / 40));
    for (let index = 0; index < count; index += 1) {
      const color = LINE_COLORS[index % LINE_COLORS.length];
      const particle = new Graphics().star(0, 0, index % 3 === 0 ? 6 : 4, 3 + Math.random() * 7, 1).fill({ color, alpha: 0.95 });
      particle.position.set(VIEW_WIDTH / 2 + (Math.random() - 0.5) * 220, VIEW_HEIGHT / 2);
      particles.addChild(particle);
      state.particleData.push({ view: particle, vx: (Math.random() - 0.5) * 11, vy: -3 - Math.random() * 10, gravity: 0.18 + Math.random() * 0.12, life: 55 + Math.random() * 55, spin: (Math.random() - 0.5) * 0.25 });
    }
  }

  function drawWin(now) {
    winGraphics.clear();
    reels.forEach((reelData) => reelData.cards.forEach((card) => {
      card.sprite.alpha = 1;
      card.sprite.scale.set(1);
    }));
    if (!state.wins.length || state.active) {
      winLabel.visible = false;
      winLabelBack.visible = false;
      return;
    }

    const index = Math.floor((now - state.cycleStart) / 1500) % state.wins.length;
    const win = state.wins[index];
    const color = LINE_COLORS[(win.lineIndex ?? index) % LINE_COLORS.length];
    const pulse = 0.65 + Math.sin(now / 135) * 0.2;
    if (index !== state.activeWin) {
      state.activeWin = index;
      const detail = win.type === 'line' ? `LINE ${win.lineIndex + 1}  •  ${win.count}× ${SYMBOLS[win.symbol].name.toUpperCase()}` : `${win.count}× ${SYMBOLS[win.symbol].name.toUpperCase()}`;
      winLabel.text = `${detail}  •  +${win.amount} CR  •  WIN ${index + 1}/${state.wins.length}`;
    }
    winLabel.visible = true;
    winLabelBack.visible = true;

    const winningCells = [];
    if (win.type === 'line') {
      const rows = PAYLINES[win.lineIndex].rows;
      state.wins.filter((item) => item.type === 'line' && item !== win).forEach((otherWin) => {
        PAYLINES[otherWin.lineIndex].rows.forEach((row, reelIndex) => {
          const x = REEL_X + reelIndex * (REEL_WIDTH + REEL_GAP) + REEL_WIDTH / 2;
          const y = REEL_Y + (row + 1) * CELL_HEIGHT + CELL_HEIGHT / 2;
          if (reelIndex === 0) winGraphics.moveTo(x, y); else winGraphics.lineTo(x, y);
        });
        winGraphics.stroke({ color: LINE_COLORS[otherWin.lineIndex % LINE_COLORS.length], width: 2, alpha: 0.12 });
      });
      const activePoints = [];
      rows.forEach((row, reelIndex) => {
        const x = REEL_X + reelIndex * (REEL_WIDTH + REEL_GAP) + REEL_WIDTH / 2;
        const y = REEL_Y + (row + 1) * CELL_HEIGHT + CELL_HEIGHT / 2;
        activePoints.push({ x, y });
        if (reelIndex === 0) winGraphics.moveTo(x, y); else winGraphics.lineTo(x, y);
        if (reelIndex < win.count) winningCells.push({ reelIndex, row });
      });
      winGraphics.stroke({ color, width: 7, alpha: pulse, cap: 'round', join: 'round' });
      winGraphics.moveTo(REEL_X + REEL_WIDTH / 2, REEL_Y + (rows[0] + 1) * CELL_HEIGHT + CELL_HEIGHT / 2);
      rows.forEach((row, reelIndex) => {
        const x = REEL_X + reelIndex * (REEL_WIDTH + REEL_GAP) + REEL_WIDTH / 2;
        const y = REEL_Y + (row + 1) * CELL_HEIGHT + CELL_HEIGHT / 2;
        winGraphics.lineTo(x, y);
      });
      winGraphics.stroke({ color: 0xffffff, width: 2, alpha: 0.75 });
      const travel = ((now - state.cycleStart) % 900) / 900 * (activePoints.length - 1);
      const segment = Math.min(activePoints.length - 2, Math.floor(travel));
      const local = travel - segment;
      const from = activePoints[segment];
      const to = activePoints[segment + 1];
      winGraphics.circle(from.x + (to.x - from.x) * local, from.y + (to.y - from.y) * local, 9).fill({ color: 0xffffff, alpha: 0.95 });
      winGraphics.circle(from.x + (to.x - from.x) * local, from.y + (to.y - from.y) * local, 18).fill({ color, alpha: 0.2 });
    } else if (win.type === 'scatter') {
      state.result.grid.forEach((column, reelIndex) => {
        [-1, 0, 1].forEach((row) => {
          if (column[ROW_KEY[row]] === 'dynamite') winningCells.push({ reelIndex, row });
        });
      });
    }

    winningCells.forEach(({ reelIndex, row }) => {
      const x = REEL_X + reelIndex * (REEL_WIDTH + REEL_GAP) + 5;
      const y = REEL_Y + (row + 1) * CELL_HEIGHT + 5;
      winGraphics.roundRect(x, y, REEL_WIDTH - 10, CELL_HEIGHT - 10, 18).stroke({ color, width: 7, alpha: pulse });
      winGraphics.roundRect(x + 5, y + 5, REEL_WIDTH - 20, CELL_HEIGHT - 20, 14).fill({ color, alpha: 0.07 + pulse * 0.08 });
      const winningCard = reels[reelIndex].cards[row + 1];
      if (winningCard) winningCard.sprite.scale.set(1.025 + pulse * 0.025);
    });
    reels.forEach((reelData, reelIndex) => reelData.cards.slice(0, 3).forEach((card, rowIndex) => {
      if (!winningCells.some((cell) => cell.reelIndex === reelIndex && cell.row === rowIndex - 1)) card.sprite.alpha = 0.68;
    }));
  }

  function tick(ticker) {
    const now = performance.now();
    if (state.active) {
      let allDone = true;
      reels.forEach((reelData) => {
        if (reelData.done) return;
        const elapsed = now - reelData.startAt;
        const progress = Math.max(0, Math.min(1, elapsed / reelData.duration));
        const previousPosition = reelData.position;
        reelData.position = reelData.startPosition + (reelData.target - reelData.startPosition) * smootherStep(progress);
        const velocity = Math.abs(reelData.position - previousPosition);
        const bouncePhase = Math.max(0, (progress - 0.82) / 0.18);
        reelData.bounce = bouncePhase > 0 ? Math.sin(bouncePhase * Math.PI * 2) * (1 - bouncePhase) * 14 : 0;
        reelData.content.alpha = 0.9 + Math.max(0, 0.1 - velocity * 0.008);
        reelData.cards.forEach((card) => {
          const stretch = Math.min(0.055, velocity * 0.008);
          card.sprite.scale.set(1 - stretch * 0.22, 1 + stretch);
        });
        if (progress >= 1) {
          reelData.position = reelData.target;
          reelData.bounce = 0;
          reelData.done = true;
          reelData.content.alpha = 1;
          reelData.cards.forEach((card) => card.sprite.scale.set(1));
          playTone(170 + reelData.index * 42, 0.09, 0.035);
        } else allDone = false;
        refreshReel(reelData);
      });
      if (allDone) {
        state.active = false;
        state.wins = state.result.wins.filter((win) => win.type !== 'jackpot');
        state.cycleStart = now;
        state.activeWin = -1;
        if (state.result.payout > 0) burst(state.result.payout);
        state.onComplete?.();
        state.onComplete = null;
      }
    }

    drawWin(now);
    state.particleData = state.particleData.filter((item) => {
      item.life -= ticker.deltaTime;
      item.vy += item.gravity * ticker.deltaTime;
      item.view.x += item.vx * ticker.deltaTime;
      item.view.y += item.vy * ticker.deltaTime;
      item.view.rotation += item.spin * ticker.deltaTime;
      item.view.alpha = Math.min(1, item.life / 22);
      if (item.life <= 0) {
        item.view.destroy();
        return false;
      }
      return true;
    });
  }

  reels.forEach((reel, index) => { reel.index = index; });
  app.ticker.add(tick);

  return {
    spin(request, reducedMotion, onComplete) {
      if (state.active) return;
      state.active = true;
      state.result = request.result;
      state.wins = [];
      state.onComplete = onComplete;
      state.activeWin = -1;
      winGraphics.clear();
      winLabel.visible = false;
      winLabelBack.visible = false;
      const now = performance.now();
      reels.forEach((reelData, index) => {
        reelData.cards.forEach((card) => { card.sprite.alpha = 1; card.sprite.scale.set(1); });
        const length = reelData.strip.length;
        const startPosition = Math.round(reelData.position);
        const targetResidue = mod(-request.stops[index], length);
        const currentResidue = mod(startPosition, length);
        const delta = mod(targetResidue - currentResidue, length) + length * (reducedMotion ? 1 : 4 + index);
        Object.assign(reelData, {
          startPosition,
          position: startPosition,
          target: startPosition + delta,
          startAt: now + index * (reducedMotion ? 18 : 45),
          duration: (reducedMotion ? 430 : 1260) + index * (reducedMotion ? 75 : 215),
          done: false,
          bounce: 0,
        });
      });
    },
    destroy() {
      app.ticker.remove(tick);
      Object.values(symbolTextures).forEach((texture) => texture.destroy(true));
    },
  };
}

export default function SlotDisplay({ spinRequest, celebrationRequest, onSpinRequest, onSpinComplete, reducedMotion, soundEnabled }) {
  const hostRef = useRef(null);
  const sceneRef = useRef(null);
  const callbacksRef = useRef({ onSpinComplete, soundEnabled });
  const audioRef = useRef(null);
  const pendingSpinRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    callbacksRef.current = { onSpinComplete, soundEnabled };
  }, [onSpinComplete, soundEnabled]);

  const playTone = (frequency, duration = 0.08, volume = 0.025) => {
    if (!callbacksRef.current.soundEnabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioRef.current ??= new AudioContextClass();
    const context = audioRef.current;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = frequency < 150 ? 'sawtooth' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, context.currentTime + duration);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  };

  useEffect(() => {
    let cancelled = false;
    const app = new Application();
    (async () => {
      try {
        await app.init({ width: VIEW_WIDTH, height: VIEW_HEIGHT, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2), preference: 'webgl' });
        if (cancelled) {
          app.destroy(true, { children: true });
          return;
        }
        app.canvas.className = 'pixi-slot-canvas';
        app.canvas.setAttribute('aria-hidden', 'true');
        Object.assign(app.canvas.style, {
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
        });
        hostRef.current?.appendChild(app.canvas);
        sceneRef.current = createPixiScene(app, playTone);
        setReady(true);
      } catch (error) {
        if (cancelled) return;
        console.error('PixiJS slot initialization failed', error);
        setInitError(error instanceof Error ? error.message : 'The renderer could not start.');
      }
    })();

    return () => {
      cancelled = true;
      sceneRef.current?.destroy();
      sceneRef.current = null;
      if (app.renderer) app.destroy(true, { children: true });
      audioRef.current?.close();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!spinRequest) return;
    pendingSpinRef.current = { request: spinRequest, reducedMotion };
    if (!ready || !sceneRef.current) return;
    const pending = pendingSpinRef.current;
    pendingSpinRef.current = null;
    setSpinning(true);
    playTone(118, 0.18, 0.045);
    sceneRef.current.spin(pending.request, pending.reducedMotion, () => {
      setSpinning(false);
      callbacksRef.current.onSpinComplete(pending.request);
    });
  }, [ready, reducedMotion, spinRequest]);

  return (
    <section className={`slot-machine-2d pixi-machine ${spinning ? 'is-spinning' : ''} ${celebrationRequest ? `celebration-${celebrationRequest.tier}` : ''}`} aria-label="Mega Mesa five-reel PixiJS slot machine">
      <div className="machine-crown" aria-hidden="true">
        <i className="crown-wing crown-left" />
        <div><small>WILD FRONTIER</small><strong>MEGA MESA</strong><span>20 WINNING LINES</span></div>
        <i className="crown-wing crown-right" />
      </div>
      <div className="lantern lantern-left" aria-hidden="true"><i /></div>
      <div className="lantern lantern-right" aria-hidden="true"><i /></div>
      <div className="machine-frame pixi-frame">
        <div className="frame-studs" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div>
        <div className="reel-window pixi-window" ref={hostRef}>
          {!ready && !initError && <div className="pixi-loading">IGNITING THE REELS…</div>}
          {initError && (
            <div className="pixi-loading pixi-error" role="alert">
              <strong>REELS COULD NOT START</strong>
              <span>{initError}</span>
            </div>
          )}
          <div className="line-numbers line-numbers-left" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index}>{index + 1}</i>)}</div>
          <div className="line-numbers line-numbers-right" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index}>{index + 11}</i>)}</div>
        </div>
      </div>
      <button className="cabinet-lever" type="button" onClick={onSpinRequest} disabled={spinning || !ready} aria-label="Pull lever to spin"><i /><b /></button>
      <div className="machine-plaque" aria-hidden="true"><span>WILD PAYS</span><b>×600</b><span>MEGA PAYS</span><b>×1000</b><span>POWERED BY PIXIJS</span></div>
    </section>
  );
}
