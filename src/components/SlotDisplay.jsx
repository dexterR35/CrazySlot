import { useEffect, useRef, useState } from 'react';
import { PAYLINES, REEL_STRIPS, SYMBOLS, gridFromStops } from '../game/slotMath.js';

const INITIAL_GRID = gridFromStops([0, 2, 4, 6, 8]);
const SYMBOL_KEYS = Object.keys(SYMBOLS);
const LINE_COLORS = ['#ffd257', '#47e6ff', '#ff4b4b', '#75ff8e', '#cf72ff'];

function randomSymbol() {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return SYMBOL_KEYS[value[0] % SYMBOL_KEYS.length];
}

function randomColumn() {
  return { top: randomSymbol(), center: randomSymbol(), bottom: randomSymbol() };
}

function SymbolArt({ symbolKey, winning }) {
  const symbol = SYMBOLS[symbolKey];
  return (
    <div className={`symbol-art symbol-${symbolKey} ${winning ? 'is-winning' : ''}`} style={{ '--symbol-color': symbol.color, '--symbol-glow': symbol.glow }}>
      {symbolKey === 'dynamite' && (
        <div className="dynamite-art" aria-hidden="true">
          <i /><i /><i /><b>✦</b>
        </div>
      )}
      {symbolKey === 'wild' && (
        <div className="wanted-art" aria-hidden="true">
          <small>WANTED</small><b>WILD</b><em>$1000</em>
        </div>
      )}
      {symbolKey === 'whiskey' && <div className="bottle-art" aria-hidden="true"><i>XXX</i></div>}
      {!['dynamite', 'wild', 'whiskey'].includes(symbolKey) && <b aria-hidden="true">{symbol.label}</b>}
      <span>{symbol.name}</span>
    </div>
  );
}

function paylinePoints(rows) {
  return rows.map((row, reel) => `${50 + reel * 100},${row === -1 ? 50 : row === 0 ? 150 : 250}`).join(' ');
}

export default function SlotDisplay({ spinRequest, celebrationRequest, onSpinRequest, onSpinComplete, reducedMotion, soundEnabled }) {
  const [grid, setGrid] = useState(INITIAL_GRID);
  const [spinning, setSpinning] = useState(false);
  const [stopped, setStopped] = useState([true, true, true, true, true]);
  const [lineWins, setLineWins] = useState([]);
  const [scatterWin, setScatterWin] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const callbacksRef = useRef({ onSpinComplete, soundEnabled });
  const audioRef = useRef(null);

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
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  };

  useEffect(() => {
    if (!spinRequest) return undefined;
    const intervals = [];
    const timeouts = [];
    let cancelled = false;
    setSpinning(true);
    setStopped([false, false, false, false, false]);
    setLineWins([]);
    setScatterWin(false);
    playTone(115, 0.14, 0.04);

    REEL_STRIPS.forEach((_, reelIndex) => {
      const interval = window.setInterval(() => {
        setGrid((current) => current.map((column, index) => (index === reelIndex ? randomColumn() : column)));
      }, reducedMotion ? 90 : 58 + reelIndex * 5);
      intervals.push(interval);

      const stopAfter = (reducedMotion ? 420 : 900) + reelIndex * (reducedMotion ? 70 : 190);
      const timeout = window.setTimeout(() => {
        window.clearInterval(interval);
        if (cancelled) return;
        setGrid((current) => current.map((column, index) => (index === reelIndex ? spinRequest.result.grid[reelIndex] : column)));
        setStopped((current) => current.map((value, index) => (index === reelIndex ? true : value)));
        playTone(175 + reelIndex * 38);

        if (reelIndex === REEL_STRIPS.length - 1) {
          setLineWins(spinRequest.result.wins.filter((win) => win.type === 'line'));
          setScatterWin(spinRequest.result.scatterCount >= 3);
          setSpinning(false);
          callbacksRef.current.onSpinComplete(spinRequest);
        }
      }, stopAfter);
      timeouts.push(timeout);
    });

    return () => {
      cancelled = true;
      intervals.forEach(window.clearInterval);
      timeouts.forEach(window.clearTimeout);
    };
  }, [reducedMotion, spinRequest]);

  useEffect(() => () => audioRef.current?.close(), []);

  useEffect(() => {
    if (!celebrationRequest) return undefined;
    setCelebrating(false);
    const frame = window.requestAnimationFrame(() => setCelebrating(true));
    const timer = window.setTimeout(() => setCelebrating(false), reducedMotion ? 500 : 1800);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [celebrationRequest, reducedMotion]);

  const winningCells = new Set();
  lineWins.forEach((win) => {
    PAYLINES[win.lineIndex].rows.slice(0, win.count).forEach((row, reel) => winningCells.add(`${reel}:${row}`));
  });
  if (scatterWin) grid.forEach((column, reel) => Object.entries(column).forEach(([rowKey, symbol]) => {
    if (symbol === 'dynamite') winningCells.add(`${reel}:${rowKey === 'top' ? -1 : rowKey === 'center' ? 0 : 1}`);
  }));

  const winningLines = lineWins.map((win) => win.lineIndex);

  return (
    <section className={`slot-machine-2d ${spinning ? 'is-spinning' : ''} ${celebrating ? `celebration-${celebrationRequest?.tier}` : ''}`} aria-label="Mega Mesa five-reel slot machine">
      <div className="machine-crown" aria-hidden="true">
        <i className="crown-wing crown-left" />
        <div><small>WILD FRONTIER</small><strong>MEGA MESA</strong><span>20 WINNING TRAILS</span></div>
        <i className="crown-wing crown-right" />
      </div>

      <div className="lantern lantern-left" aria-hidden="true"><i /></div>
      <div className="lantern lantern-right" aria-hidden="true"><i /></div>

      <div className="machine-frame">
        <div className="frame-studs" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div>
        <div className="reel-window">
          <div className="line-numbers line-numbers-left" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index}>{index + 1}</i>)}</div>
          <div className="reels-grid">
            {grid.map((column, reelIndex) => (
              <div className={`reel-column ${stopped[reelIndex] ? 'has-stopped' : 'is-moving'}`} key={reelIndex}>
                {['top', 'center', 'bottom'].map((rowKey, rowIndex) => {
                  const row = rowIndex - 1;
                  return (
                    <div className="symbol-cell" key={rowKey}>
                      <SymbolArt symbolKey={column[rowKey]} winning={winningCells.has(`${reelIndex}:${row}`)} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <svg className="payline-overlay" viewBox="0 0 500 300" preserveAspectRatio="none" aria-hidden="true">
            {winningLines.map((lineIndex) => (
              <polyline
                key={lineIndex}
                points={paylinePoints(PAYLINES[lineIndex].rows)}
                style={{ '--line-color': LINE_COLORS[lineIndex % LINE_COLORS.length] }}
              />
            ))}
          </svg>
          <div className="line-numbers line-numbers-right" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index}>{index + 11}</i>)}</div>
          <div className="reel-shine" aria-hidden="true" />
        </div>
      </div>

      <button className="cabinet-lever" type="button" onClick={onSpinRequest} disabled={spinning} aria-label="Pull lever to spin">
        <i /><b />
      </button>
      <div className="machine-plaque" aria-hidden="true"><span>WILD PAYS</span><b>×600</b><span>MEGA PAYS</span><b>×1000</b></div>
    </section>
  );
}
