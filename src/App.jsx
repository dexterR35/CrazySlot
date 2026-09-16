import { useCallback, useEffect, useMemo, useState } from 'react';
import SlotDisplay from './components/SlotDisplay.jsx';
import { createStops, evaluateSpin, formatCredits, PAYTABLE, SYMBOLS } from './game/slotMath.js';

const BET_OPTIONS = [20, 40, 100, 200, 400];
const AUTO_SPINS = 10;

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

function BrandMark() {
  return (
    <div className="brand" aria-label="Mega Mesa">
      <span className="brand-gem" aria-hidden="true">★</span>
      <span>
        <b>MEGA</b>
        <em>MESA</em>
      </span>
    </div>
  );
}

function Stat({ label, value, accent = false }) {
  return (
    <div className={`stat ${accent ? 'stat-accent' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Paytable({ open, onClose }) {
  return (
    <div className={`drawer-backdrop ${open ? 'is-open' : ''}`} aria-hidden={!open} onMouseDown={onClose}>
      <aside className="paytable" role="dialog" aria-modal="true" aria-label="Paytable" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">WIN GUIDE</span>
            <h2>Paytable</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close paytable">×</button>
        </div>
        <p className="drawer-copy">Wins pay from the leftmost reel across 20 fixed lines. WILD substitutes for every paying symbol. Three or more TNT symbols anywhere award free spins.</p>
        <div className="paytable-grid">
          {Object.entries(PAYTABLE).map(([key, payouts]) => (
            <div className="pay-row" key={key}>
              <span className="mini-symbol" style={{ '--symbol-color': SYMBOLS[key].color }}>{SYMBOLS[key].label}</span>
              <span className="pay-name">{SYMBOLS[key].name}</span>
              <span><small>3×</small>{payouts[3]}×</span>
              <span><small>4×</small>{payouts[4]}×</span>
              <span><small>5×</small>{payouts[5]}×</span>
            </div>
          ))}
        </div>
        <div className="bonus-rule">
          <span className="mini-symbol" style={{ '--symbol-color': SYMBOLS.dynamite.color }}>TNT</span>
          <p><strong>Dynamite Bonus</strong><small>3 / 4 / 5 scatters award 5 / 8 / 12 free spins</small></p>
        </div>
        <div className="line-guide">
          <span>5×3</span><span>20</span><span>W</span><span>TNT</span><span>MEGA</span>
          <p>Five reels · 20 lines · Wilds · Free spins · Progressive jackpot</p>
        </div>
      </aside>
    </div>
  );
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const [balance, setBalance] = useState(2500);
  const [bet, setBet] = useState(100);
  const [phase, setPhase] = useState('idle');
  const [spinRequest, setSpinRequest] = useState(null);
  const [lastWin, setLastWin] = useState(0);
  const [lifetimeWin, setLifetimeWin] = useState(0);
  const [progressive, setProgressive] = useState(37_850);
  const [freeSpins, setFreeSpins] = useState(0);
  const [message, setMessage] = useState('RIDE INTO FORTUNE');
  const [autoRemaining, setAutoRemaining] = useState(0);
  const [paytableOpen, setPaytableOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [celebrationRequest, setCelebrationRequest] = useState(null);
  const [winBanner, setWinBanner] = useState(null);
  const [history, setHistory] = useState([]);

  const canSpin = phase === 'idle' && (freeSpins > 0 || balance >= bet);

  const startSpin = useCallback(() => {
    const isFreeSpin = freeSpins > 0;
    if (phase !== 'idle' || (!isFreeSpin && balance < bet)) {
      if (!isFreeSpin && balance < bet) {
        setMessage('NOT ENOUGH DEMO CREDITS');
        setAutoRemaining(0);
      }
      return;
    }

    const stops = createStops();
    const result = evaluateSpin(stops, bet, progressive);
    const request = {
      id: globalThis.crypto.randomUUID(),
      stops,
      result,
      bet,
      cost: isFreeSpin ? 0 : bet,
      isFreeSpin,
    };
    if (isFreeSpin) setFreeSpins((current) => Math.max(0, current - 1));
    else {
      setBalance((current) => current - bet);
      setProgressive((current) => current + Math.max(1, Math.round(bet * 0.02)));
    }
    setLastWin(0);
    setMessage(isFreeSpin ? 'FREE SPIN' : 'SADDLE UP');
    setPhase('spinning');
    setSpinRequest(request);
  }, [balance, bet, freeSpins, phase, progressive]);

  const finishSpin = useCallback((request) => {
    const { payout, wins, freeSpinsAwarded, megaJackpot } = request.result;
    if (freeSpinsAwarded) setFreeSpins((current) => current + freeSpinsAwarded);
    if (payout > 0) {
      setBalance((current) => current + payout);
      setLifetimeWin((current) => current + payout);
      setLastWin(payout);
      const tier = megaJackpot ? 'mega' : payout >= request.bet * 20 ? 'epic' : 'win';
      const label = megaJackpot ? 'MEGA JACKPOT' : freeSpinsAwarded ? `${freeSpinsAwarded} FREE SPINS` : payout >= request.bet * 20 ? 'OUTLAW BIG WIN' : `${wins[0].lineName.toUpperCase()} WIN`;
      setMessage(label);
      setCelebrationRequest({ id: request.id, tier });
      setWinBanner({ id: request.id, tier, label, amount: payout });
      if (megaJackpot) setProgressive(25_000);
    } else {
      setMessage(freeSpinsAwarded ? `${freeSpinsAwarded} FREE SPINS` : 'THE TRAIL CONTINUES');
    }
    setHistory((current) => [
      {
        id: request.id,
        payout,
        symbols: request.result.grid.map((reel) => reel.center),
        lines: wins.filter((win) => win.type === 'line').map((win) => win.lineIndex + 1),
      },
      ...current,
    ].slice(0, 4));
    if (!request.isFreeSpin) setAutoRemaining((current) => Math.max(0, current - 1));
    setPhase('idle');
  }, []);

  useEffect(() => {
    if (!winBanner) return undefined;
    const timer = window.setTimeout(() => setWinBanner(null), reducedMotion ? 900 : 3300);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, winBanner]);

  useEffect(() => {
    if (phase !== 'idle' || (autoRemaining <= 0 && freeSpins <= 0)) return undefined;
    if (freeSpins <= 0 && balance < bet) {
      setAutoRemaining(0);
      setMessage('AUTO PLAY STOPPED');
      return undefined;
    }
    const timer = window.setTimeout(startSpin, reducedMotion ? 180 : 650);
    return () => window.clearTimeout(timer);
  }, [autoRemaining, balance, bet, freeSpins, phase, reducedMotion, startSpin]);

  const toggleAuto = () => {
    if (autoRemaining > 0) {
      setAutoRemaining(0);
      setMessage('AUTO PLAY STOPPED');
    } else if (canSpin) {
      setAutoRemaining(AUTO_SPINS);
      setMessage('AUTO PLAY READY');
    }
  };

  const changeBet = (direction) => {
    if (phase !== 'idle' || autoRemaining > 0) return;
    const index = BET_OPTIONS.indexOf(bet);
    const next = Math.min(BET_OPTIONS.length - 1, Math.max(0, index + direction));
    setBet(BET_OPTIONS[next]);
  };

  const latestSymbols = useMemo(() => history[0]?.symbols ?? [], [history]);
  const latestLines = useMemo(() => history[0]?.lines ?? [], [history]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <BrandMark />
        <div className="session-stats">
          <Stat label="BALANCE" value={`${formatCredits(balance)} CR`} />
          <span className="divider" aria-hidden="true" />
          <Stat label="MEGA POT" value={`${formatCredits(progressive)} CR`} accent />
        </div>
        <div className="top-actions">
          <button className="utility-button" type="button" onClick={() => setPaytableOpen(true)}>ⓘ <span>PAYTABLE</span></button>
          <button className="icon-button" type="button" onClick={() => setSoundEnabled((current) => !current)} aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}>
            {soundEnabled ? '♪' : '×'}
          </button>
        </div>
      </header>

      <main className="game-stage">
        <div className="stage-glow" aria-hidden="true" />
        <SlotDisplay
          spinRequest={spinRequest}
          celebrationRequest={celebrationRequest}
          onSpinRequest={startSpin}
          onSpinComplete={finishSpin}
          reducedMotion={reducedMotion}
          soundEnabled={soundEnabled}
        />

        {winBanner && (
          <div className={`win-banner win-${winBanner.tier}`} key={winBanner.id} aria-live="assertive">
            <span>{winBanner.label}</span>
            <strong>{formatCredits(winBanner.amount)}</strong>
            <small>DEMO CREDITS</small>
          </div>
        )}

        <section className="jackpot-card" aria-label="Progressive jackpot display">
          <span>MEGA PROGRESSIVE</span>
          <strong>{formatCredits(progressive)}</strong>
          <small>FIVE MEGA SYMBOLS ON CENTER</small>
        </section>

        <section className={`result-card ${lastWin > 0 ? 'has-win' : ''}`} aria-live="polite">
          <span>{message}</span>
          <strong>{lastWin > 0 ? `+${formatCredits(lastWin)} CR` : freeSpins > 0 ? `${freeSpins} FREE SPINS` : '20 LINES ACTIVE'}</strong>
          {latestSymbols.length > 0 && (
            <div className="last-symbols" aria-label="Last center row">
              {latestSymbols.map((symbol, index) => <i key={`${symbol}-${index}`} style={{ color: SYMBOLS[symbol].color }}>{SYMBOLS[symbol].label}</i>)}
            </div>
          )}
          {latestLines.length > 0 && (
            <div className="win-line-chips" aria-label={`Winning lines ${latestLines.join(', ')}`}>
              <b>LINES</b>
              {latestLines.slice(0, 4).map((line) => <i key={line}>{line}</i>)}
              {latestLines.length > 4 && <i>+{latestLines.length - 4}</i>}
            </div>
          )}
        </section>
      </main>

      <section className="control-dock" aria-label="Game controls">
        <div className="bet-control">
          <span>BET</span>
          <button type="button" onClick={() => changeBet(-1)} disabled={phase !== 'idle' || autoRemaining > 0 || bet === BET_OPTIONS[0]} aria-label="Decrease bet">−</button>
          <strong>{bet} <small>CR</small></strong>
          <button type="button" onClick={() => changeBet(1)} disabled={phase !== 'idle' || autoRemaining > 0 || bet === BET_OPTIONS.at(-1)} aria-label="Increase bet">+</button>
        </div>

        <button className="spin-button" type="button" onClick={startSpin} disabled={!canSpin || autoRemaining > 0}>
          <span className={phase === 'spinning' ? 'spin-icon is-spinning' : 'spin-icon'}>↻</span>
          <strong>{phase === 'spinning' ? 'SPINNING' : 'SPIN'}</strong>
          <small>{freeSpins > 0 ? `${freeSpins} FREE` : `${bet} CREDITS`}</small>
        </button>

        <button className={`auto-button ${autoRemaining > 0 ? 'is-active' : ''}`} type="button" onClick={toggleAuto} disabled={phase === 'spinning' && autoRemaining === 0}>
          <span>⟳</span>
          <span><strong>{autoRemaining > 0 ? 'STOP AUTO' : 'AUTO SPIN'}</strong><small>{autoRemaining > 0 ? `${autoRemaining} REMAINING` : `${AUTO_SPINS} ROUNDS`}</small></span>
        </button>
      </section>

      <footer>
        <span><i className="status-dot" /> CRYPTO DEMO RNG / 20 LINES</span>
        <p>Entertainment demo only / No deposits / No real-money wagering</p>
        <span>5 REELS / 3 ROWS / PIXIJS WEBGL</span>
      </footer>

      <Paytable open={paytableOpen} onClose={() => setPaytableOpen(false)} />
    </div>
  );
}
