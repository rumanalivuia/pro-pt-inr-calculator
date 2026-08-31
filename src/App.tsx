/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  Clipboard,
  RotateCcw,
  History as HistoryIcon,
  Sun,
  Moon,
  Pin,
  Minimize2,
  Maximize2,
  Trash2,
  X,
  Minus,
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryEntry {
  inr: string;
  ratio: string;
  index: string;
  ppt: number;
  cpt: number;
  isi: number;
  label: string;
  color: string;
  time: string;
  comment?: string | null;
  /** Token reference for the result color, e.g. "var(--status-therapeutic)". */
  colorToken?: string;
}

type FieldErrors = {
  patientPT: string | null;
  controlPT: string | null;
  isi: string | null;
};

export default function App() {
  const [patientPT, setPatientPT] = useState<string>('');
  const [controlPT, setControlPT] = useState<string>('');
  const [isi, setIsi] = useState<string>('');
  const [isDark, setIsDark] = useState(true);
  const [isFloat, setIsFloat] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState<null | 'inr' | 'ratio' | 'index' | 'all' | 'comment'>(null);
  const [copyError, setCopyError] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errors, setErrors] = useState<FieldErrors>({ patientPT: null, controlPT: null, isi: null });
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);
  const [confirmingClear, setConfirmingClear] = useState<boolean>(false);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const controlInputRef = useRef<HTMLInputElement>(null);
  const isiInputRef = useRef<HTMLInputElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);

  const appRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Load settings
  useEffect(() => {
    const savedHistory = localStorage.getItem('inr_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedControl = localStorage.getItem('inr_control_pt');
    if (savedControl) setControlPT(savedControl);
    
    const savedIsi = localStorage.getItem('inr_isi');
    if (savedIsi) setIsi(savedIsi);
  }, []);

  // Save history
  useEffect(() => {
    localStorage.setItem('inr_history', JSON.stringify(history));
  }, [history]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('inr_control_pt', controlPT);
  }, [controlPT]);

  useEffect(() => {
    localStorage.setItem('inr_isi', isi);
  }, [isi]);

  // Electron IPC helper
  const sendToElectron = (channel: string, data?: any) => {
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.send(channel, data);
    }
  };

  // Sync "Always on Top" with Float mode
  useEffect(() => {
    sendToElectron('set-always-on-top', isFloat);
  }, [isFloat]);

  // Sync Window Size with Float/Minimized mode
  useEffect(() => {
    if (isMinimized) {
      sendToElectron('resize-window', { width: 300, height: 60 });
    } else if (isFloat) {
      sendToElectron('resize-window', { width: 320, height: 600 });
    } else {
      sendToElectron('resize-window', { width: 420, height: 680 });
    }
  }, [isMinimized, isFloat]);

  // Dark mode effect
  useEffect(() => {
    document.body.classList.toggle('light', !isDark);
  }, [isDark]);

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const calculation = useMemo(() => {
    const ppt = parseFloat(patientPT);
    const cpt = parseFloat(controlPT);
    const isiVal = parseFloat(isi);

    if (isNaN(ppt) || isNaN(cpt) || isNaN(isiVal) || ppt <= 0 || cpt <= 0 || isiVal <= 0) {
      return null;
    }

    const inr = Math.pow(ppt / cpt, isiVal);
    const ptRatio = ppt / cpt;
    const ptActivity = (cpt / ppt) * 100;

    let label = 'Normal';
    let color = 'var(--status-normal)';
    let glow = 'var(--tint-normal)';
    let comment: string | null = null;

    if (inr < 0.8) {
      label = 'Low'; color = 'var(--status-low)'; glow = 'var(--tint-low)';
    } else if (inr <= 1.2) {
      label = 'Normal'; color = 'var(--status-normal)'; glow = 'var(--tint-normal)';
    } else {
      comment = "PT value is significantly elevated, test may be repeated with fresh sample if clinical condition suggests.";
      if (inr <= 2.0)        { label = 'Elevated';    color = 'var(--status-elevated)';    glow = 'var(--tint-elevated)'; }
      else if (inr <= 3.0)   { label = 'Therapeutic'; color = 'var(--status-therapeutic)'; glow = 'var(--tint-therapeutic)'; }
      else if (inr <= 4.0)   { label = 'High';        color = 'var(--status-high)';        glow = 'var(--tint-high)'; }
      else if (inr <= 5.0)   { label = 'Very High';   color = 'var(--status-critical)';   glow = 'var(--tint-critical)'; }
      else                   { label = 'CRITICAL';    color = 'var(--status-critical)';   glow = 'var(--tint-critical)'; }
    }

    return { inr, ptRatio, ptActivity, label, color, glow, comment };
  }, [patientPT, controlPT, isi]);

  // Add to history when calculation changes and values are stable
  useEffect(() => {
    if (calculation && patientPT && controlPT && isi) {
      const timer = setTimeout(() => {
        const entry: HistoryEntry = {
          inr: calculation.inr.toFixed(2),
          ratio: calculation.ptRatio.toFixed(2),
          index: calculation.ptActivity.toFixed(1),
          ppt: parseFloat(patientPT),
          cpt: parseFloat(controlPT),
          isi: parseFloat(isi),
          label: calculation.label,
          color: calculation.color,
          colorToken: calculation.color,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          comment: calculation.comment
        };
        
        setHistory(prev => {
          // Avoid duplicates if the values are the same as the last entry
          if (prev.length > 0 && 
              prev[0].inr === entry.inr && 
              prev[0].ppt === entry.ppt && 
              prev[0].cpt === entry.cpt) {
            return prev;
          }
          return [entry, ...prev].slice(0, 20);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [calculation]);

  // Clipboard helper — single path so every copy reports the same outcome.
  // Returns a promise so callers can show a loading state.
  const writeClipboard = async (text: string): Promise<boolean> => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard write failed', err);
      return false;
    }
  };

  const flashCopy = (key: typeof copied) => {
    setCopied(key);
    setTimeout(() => setCopied((current) => (current === key ? null : current)), 2000);
  };

  const handleCopyAll = async () => {
    if (!calculation || isCopying) return;
    setIsCopying(true);
    setCopyError(false);
    let text = `INR: ${calculation.inr.toFixed(2)} | Ratio: ${calculation.ptRatio.toFixed(2)} | Index: ${calculation.ptActivity.toFixed(1)}%`;
    if (calculation.comment) {
      text += ` | Comment: ${calculation.comment}`;
    }
    const ok = await writeClipboard(text);
    setIsCopying(false);
    if (ok) {
      flashCopy('all');
      setStatusMessage('All values copied to clipboard.');
    } else {
      setCopyError(true);
      setStatusMessage('Copy failed. Select the value and press Ctrl+C.');
    }
  };

  const copyIndividual = async (text: string, type: 'inr' | 'ratio' | 'index') => {
    if (isCopying) return;
    setIsCopying(true);
    setCopyError(false);
    const ok = await writeClipboard(text);
    setIsCopying(false);
    if (ok) {
      flashCopy(type);
      setStatusMessage(`${type.toUpperCase()} value copied to clipboard.`);
    } else {
      setCopyError(true);
      setStatusMessage('Copy failed. Select the value and press Ctrl+C.');
    }
  };

  // Field validation — pure, called on every input change. The threshold for
  // all numeric fields is > 0; negative ISI and zero PT both break the math.
  const validate = (ppt: string, cpt: string, isiVal: string): FieldErrors => {
    const next: FieldErrors = { patientPT: null, controlPT: null, isi: null };
    const pptN = parseFloat(ppt);
    const cptN = parseFloat(cpt);
    const isiN = parseFloat(isiVal);

    if (ppt.trim() !== '' && (isNaN(pptN) || pptN <= 0)) {
      next.patientPT = 'Patient PT must be greater than 0.';
    }
    if (cpt.trim() !== '' && (isNaN(cptN) || cptN <= 0)) {
      next.controlPT = 'Control PT must be greater than 0.';
    }
    if (isiVal.trim() !== '' && (isNaN(isiN) || isiN <= 0)) {
      next.isi = 'ISI must be greater than 0.';
    }
    return next;
  };

  // Reset is a recoverable action (clears three inputs, the user just retypes)
  // but the button is right next to History. We use a one-tap confirm step
  // when any field has content, so a misclick on the wrong button does not
  // destroy a half-typed entry.
  const requestReset = () => {
    if (confirmingReset) {
      performReset();
      return;
    }
    if (!patientPT && !controlPT && !isi) {
      setStatusMessage('Nothing to reset.');
      return;
    }
    setConfirmingReset(true);
    setStatusMessage('Press Reset again to confirm. Press Escape to cancel.');
    setTimeout(() => setConfirmingReset(false), 4000);
  };

  const cancelReset = () => {
    setConfirmingReset(false);
    setStatusMessage('Reset cancelled.');
  };

  const performReset = () => {
    setPatientPT('');
    setControlPT('');
    setIsi('');
    setErrors({ patientPT: null, controlPT: null, isi: null });
    setConfirmingReset(false);
    setStatusMessage('All fields cleared.');
    requestAnimationFrame(() => patientInputRef.current?.focus());
  };

  const requestClearHistory = () => {
    if (confirmingClear) {
      setHistory([]);
      setConfirmingClear(false);
      setStatusMessage('History cleared.');
      return;
    }
    if (history.length === 0) return;
    setConfirmingClear(true);
    setStatusMessage('Press Clear again to confirm. Press Escape to cancel.');
    setTimeout(() => setConfirmingClear(false), 4000);
  };

  const cancelClearHistory = () => {
    setConfirmingClear(false);
    setStatusMessage('Clear cancelled.');
  };

  // Global keyboard shortcuts. Escape cancels pending confirm or resets
  // (after a brief delay if any field has content). Cmd/Ctrl+C copies the
  // full result when no input has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmingReset) { e.preventDefault(); cancelReset(); return; }
        if (confirmingClear) { e.preventDefault(); cancelClearHistory(); return; }
        e.preventDefault();
        requestReset();
        return;
      }
      const isCopyCombo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c';
      const target = e.target as HTMLElement | null;
      const inField = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isCopyCombo && !inField && calculation) {
        e.preventDefault();
        handleCopyAll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [calculation, confirmingReset, confirmingClear]);

  // Re-validate as the user types
  useEffect(() => {
    setErrors(validate(patientPT, controlPT, isi));
  }, [patientPT, controlPT, isi]);

  // Announce calculation changes (only when values become valid, to avoid noise)
  useEffect(() => {
    if (calculation) {
      setStatusMessage(`INR ${calculation.inr.toFixed(2)}, ${calculation.label}.`);
    }
  }, [calculation?.inr, calculation?.label]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFloat) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className={`relative w-screen h-screen flex items-start justify-center overflow-hidden transition-colors duration-500 ${isMinimized ? 'bg-transparent' : 'bg-[var(--bg)]'}`}>
      {/* Skip link — first focusable element for keyboard users */}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:bg-[var(--primary)] focus:text-[var(--on-primary)] focus:rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]">
        Skip to main content
      </a>

      {/* Polite live region — only this is announced. Set, never inserted. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      <div className="grid-bg" />
      
      {/* Ambient background glows */}
      <div className="fixed top-[-30%] left-[-20%] w-[60%] h-[60%] bg-[radial-gradient(ellipse,color-mix(in_oklch,var(--primary-deep)_12%,transparent)_0%,transparent_70%)] pointer-events-none animate-[pulse-bg_6s_ease-in-out_infinite_alternate]" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(ellipse,color-mix(in_oklch,var(--primary)_9%,transparent)_0%,transparent_70%)] pointer-events-none animate-[pulse-bg_8s_ease-in-out_infinite_alternate-reverse]" />

      <motion.div 
        ref={appRef}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          x: 0,
          scale: 1,
          width: '100%',
          height: '100%'
        }}
        className={`relative border border-[var(--border)] rounded-[12px] shadow-[0_32px_80px_color-mix(in_oklch,black_60%,transparent)] overflow-hidden z-10 flex flex-col transition-colors duration-500 ${isMinimized ? 'bg-[color-mix(in_oklch,var(--surface)_20%,transparent)] backdrop-blur-[8px]' : 'bg-[color-mix(in_oklch,var(--surface)_85%,transparent)] backdrop-blur-xl'}`}
      >
        {/* Title Bar */}
        <div
          className="flex items-center justify-between p-[12px_16px] bg-[color-mix(in_oklch,var(--surface)_85%,black)] border-b border-[var(--border)] select-none drag-region"
        >
          <div className="flex items-center gap-[10px]">
            <div className="w-[30px] h-[30px] bg-[linear-gradient(135deg,var(--primary-deep),var(--primary))] rounded-[8px] flex items-center justify-center text-[14px] shadow-[0_4px_12px_color-mix(in_oklch,var(--primary)_40%,transparent)]">
              <Activity size={16} className="text-[var(--on-primary)]" />
            </div>
            <div>
              <div className="text-[13px] font-bold tracking-[0.04em] text-[var(--text)]">PT/INR Calculator</div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] tracking-[0.05em] uppercase">Anticoagulation Monitor</div>
            </div>
          </div>
          <div className="flex items-center gap-[8px] no-drag">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`w-[28px] h-[28px] rounded-[7px] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] flex items-center justify-center transition-[var(--transition)] hover:text-[var(--text)] hover:border-[var(--primary)] ${!isDark ? 'bg-[var(--tint-elevated)] text-[var(--status-elevated)] border-[var(--status-elevated)]' : ''}`}
              title="Toggle Theme"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="w-[28px] h-[28px] rounded-[7px] border border-[var(--primary)] bg-[var(--tint-primary)] text-[var(--primary)] flex items-center justify-center transition-[var(--transition)] hover:bg-[color-mix(in_oklch,var(--primary)_22%,transparent)]"
                title="Install App"
                aria-label="Install as application"
              >
                <Activity size={14} className="animate-pulse" />
              </button>
            )}
            <button
              onClick={() => {
                setIsFloat(!isFloat);
                if (!isFloat) setPosition({ x: 0, y: 0 });
              }}
              className={`w-[28px] h-[28px] rounded-[7px] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] flex items-center justify-center transition-[var(--transition)] hover:text-[var(--text)] hover:border-[var(--primary)] ${isFloat ? 'bg-[var(--tint-primary)] text-[var(--primary)] border-[var(--primary)]' : ''}`}
              aria-label={isFloat ? 'Unpin from always-on-top' : 'Pin as always-on-top'}
              aria-pressed={isFloat}
            >
              <Pin size={14} className={isFloat ? 'fill-current' : ''} />
            </button>
            <button
              onClick={() => sendToElectron('minimize-window')}
              className="hit-area w-[28px] h-[28px] rounded-[7px] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] flex items-center justify-center transition-[var(--transition)] hover:text-[var(--text)] hover:border-[var(--primary)]"
              title="Minimize to Taskbar"
              aria-label="Minimize to taskbar"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hit-area w-[28px] h-[28px] rounded-[7px] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] flex items-center justify-center transition-[var(--transition)] hover:text-[var(--text)] hover:border-[var(--primary)]"
              aria-label={isMinimized ? 'Restore window' : 'Minimize to compact view'}
              aria-pressed={isMinimized}
            >
              {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
            <button
              onClick={() => sendToElectron('close-window')}
              className="hit-area w-[28px] h-[28px] rounded-[7px] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] flex items-center justify-center transition-[var(--transition)] hover:bg-[var(--tint-critical)] hover:text-[var(--status-critical)] hover:border-[var(--status-critical)]"
              title="Close"
              aria-label="Close application"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <main id="main" className="flex-1 flex flex-col min-h-0" aria-label="PT/INR calculator">
        <AnimatePresence mode="wait">
          {isMinimized ? (
            <motion.div
              key="minimized"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-[10px_16px] bg-[rgba(0,0,0,0.35)] backdrop-blur-[12px] flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] drag-region h-full"
            >
              <div className="flex gap-5 no-drag">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">INR</span>
                  <span className="text-[15px] font-mono font-bold text-[var(--primary)] leading-none">{calculation?.inr.toFixed(2) || '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Ratio</span>
                  <span className="text-[15px] font-mono font-bold text-[var(--status-normal)] leading-none">{calculation?.ptRatio.toFixed(2) || '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Index</span>
                  <span className="text-[15px] font-mono font-bold text-[var(--status-elevated)] leading-none">{calculation?.ptActivity.toFixed(1) || '—'}%</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 no-drag">
                <div
                  className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_90%,transparent)]"
                  style={{ color: calculation?.color, borderColor: `color-mix(in_oklch,${calculation?.color} 35%,transparent)` }}
                >
                  {calculation?.label || 'Ready'}
                </div>
                <button
                  onClick={() => sendToElectron('minimize-window')}
                  className="w-5 h-5 rounded-md bg-[color-mix(in_oklch,var(--surface)_92%,transparent)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[color-mix(in_oklch,var(--surface)_85%,transparent)] hover:text-[var(--text)] transition-all"
                  title="Minimize to Taskbar"
                  aria-label="Minimize to taskbar"
                >
                  <Minus size={10} />
                </button>
                <button
                  onClick={() => setIsMinimized(false)}
                  className="w-5 h-5 rounded-md bg-[color-mix(in_oklch,var(--surface)_92%,transparent)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[color-mix(in_oklch,var(--surface)_85%,transparent)] hover:text-[var(--text)] transition-all"
                  aria-label="Restore window"
                >
                  <Maximize2 size={10} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="p-[20px_20px_0] motion-field-in">
                <h2 className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-[0.1em] mb-[12px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[var(--border)] font-normal">
                  Patient Values
                </h2>

                {/* Inputs */}
                <div className="flex flex-col gap-[16px] mb-[16px]" role="group" aria-label="PT calculation inputs">
                  {/* Row 1: Control PT and ISI — staggered entrance for clarity */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                    className="grid grid-cols-2 gap-[10px]"
                  >
                    <div className="flex flex-col gap-[6px]">
                      <label htmlFor="control-pt" className="text-[10px] font-mono text-[var(--text-muted)] tracking-[0.05em] uppercase">Control PT</label>
                      <input
                        id="control-pt"
                        ref={controlInputRef}
                        className={`bg-[var(--field-bg)] border-[1.5px] rounded-[var(--radius-sm)] text-[var(--text)] font-mono text-[18px] font-medium text-center p-[10px_6px] outline-none w-full transition-[var(--transition)] focus:bg-[var(--field-bg-focus)] ${errors.controlPT ? 'border-[var(--field-error)]' : 'border-[var(--field-border)] focus:border-[var(--field-border-active)]'}`}
                        type="number"
                        step="any"
                        inputMode="decimal"
                        min="0"
                        value={controlPT}
                        onChange={(e) => setControlPT(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); patientInputRef.current?.focus(); }
                          if (e.key === 'ArrowDown') { e.preventDefault(); patientInputRef.current?.focus(); }
                          if (e.key === 'ArrowUp') { e.preventDefault(); isiInputRef.current?.focus(); }
                        }}
                        placeholder="0.0"
                        aria-invalid={errors.controlPT ? 'true' : 'false'}
                        aria-describedby={errors.controlPT ? 'control-pt-error' : 'control-pt-unit'}
                      />
                      {errors.controlPT ? (
                        <div id="control-pt-error" role="alert" className="text-[9px] font-mono text-[var(--field-error)] text-center tracking-[0.04em] flex items-center justify-center gap-1">
                          <AlertTriangle size={9} aria-hidden="true" />
                          {errors.controlPT}
                        </div>
                      ) : (
                        <div id="control-pt-unit" className="text-[9px] font-mono text-[var(--text-muted)] text-center tracking-[0.04em]">seconds</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      <label htmlFor="isi" className="text-[10px] font-mono text-[var(--text-muted)] tracking-[0.05em] uppercase">ISI</label>
                      <input
                        id="isi"
                        ref={isiInputRef}
                        className={`bg-[var(--field-bg)] border-[1.5px] rounded-[var(--radius-sm)] text-[var(--text)] font-mono text-[18px] font-medium text-center p-[10px_6px] outline-none w-full transition-[var(--transition)] focus:bg-[var(--field-bg-focus)] ${errors.isi ? 'border-[var(--field-error)]' : 'border-[var(--field-border)] focus:border-[var(--field-border-active)]'}`}
                        type="number"
                        step="any"
                        inputMode="decimal"
                        min="0"
                        value={isi}
                        onChange={(e) => setIsi(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); patientInputRef.current?.focus(); }
                          if (e.key === 'ArrowUp') { e.preventDefault(); controlInputRef.current?.focus(); }
                        }}
                        placeholder="1.0"
                        aria-invalid={errors.isi ? 'true' : 'false'}
                        aria-describedby={errors.isi ? 'isi-error' : 'isi-unit'}
                      />
                      {errors.isi ? (
                        <div id="isi-error" role="alert" className="text-[9px] font-mono text-[var(--field-error)] text-center tracking-[0.04em] flex items-center justify-center gap-1">
                          <AlertTriangle size={9} aria-hidden="true" />
                          {errors.isi}
                        </div>
                      ) : (
                        <div id="isi-unit" className="text-[9px] font-mono text-[var(--text-muted)] text-center tracking-[0.04em]">index</div>
                      )}
                    </div>
                  </motion.div>

                  {/* Row 2: Patient PT (Highlighted) — larger entrance, lands last */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
                    className="flex flex-col gap-[6px]"
                  >
                    <label htmlFor="patient-pt" className="text-[10px] font-mono text-[var(--primary)] font-bold tracking-[0.05em] uppercase">Patient PT (Active Input)</label>
                    <input
                      id="patient-pt"
                      ref={patientInputRef}
                      className={`bg-[var(--field-bg)] border-[2px] rounded-[var(--radius-sm)] text-[var(--text)] font-mono text-[24px] font-bold text-center p-[12px_6px] outline-none w-full transition-[var(--transition)] focus:bg-[var(--field-bg-focus)] ${errors.patientPT ? 'border-[var(--field-error)]' : 'border-[var(--primary)]'}`}
                      type="number"
                      step="any"
                      inputMode="decimal"
                      min="0"
                      value={patientPT}
                      onChange={(e) => setPatientPT(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleCopyAll(); }
                        if (e.key === 'ArrowUp') { e.preventDefault(); controlInputRef.current?.focus(); }
                      }}
                      placeholder="0.0"
                      aria-invalid={errors.patientPT ? 'true' : 'false'}
                      aria-describedby={errors.patientPT ? 'patient-pt-error' : 'patient-pt-hint'}
                      autoFocus
                    />
                    {errors.patientPT ? (
                      <div id="patient-pt-error" role="alert" className="text-[10px] font-mono text-[var(--field-error)] text-center font-medium tracking-[0.04em] flex items-center justify-center gap-1">
                        <AlertTriangle size={10} aria-hidden="true" />
                        {errors.patientPT}
                      </div>
                    ) : (
                      <div id="patient-pt-hint" className="text-[10px] font-mono text-[var(--primary)] text-center font-medium tracking-[0.04em]">Enter patient's PT value here</div>
                    )}
                  </motion.div>
                </div>

                {/* Result */}
                <motion.h2
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
                  className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-[0.1em] mb-[12px] flex items-center gap-[8px] after:content-[''] after:flex-1 after:h-[1px] after:bg-[var(--border)] font-normal"
                >
                  Result
                </motion.h2>
                <div
                  className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] p-[18px] mb-[16px] relative overflow-hidden transition-[var(--transition)]"
                  style={{ '--result-color': calculation?.color || 'var(--primary)' } as React.CSSProperties}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] transition-[var(--transition)]"
                    style={{ background: `linear-gradient(90deg, transparent, ${calculation?.color || 'var(--primary)'}, transparent)` }}
                  />
                  <div
                    className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[200px] h-[100px] pointer-events-none"
                    style={{ background: `radial-gradient(ellipse, ${calculation?.glow || 'var(--tint-primary)'} 0%, transparent 70%)` }}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex justify-between items-center w-full mb-[4px]">
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-[0.1em]">INR Value</div>
                      <div
                        className="text-[10px] font-mono font-semibold p-[3px_10px] rounded-[20px] border tracking-[0.06em] uppercase transition-[var(--transition)]"
                        style={{
                          color: calculation?.color || 'var(--text-muted)',
                          borderColor: calculation?.color || 'var(--border)',
                          background: calculation?.glow || 'transparent'
                        }}
                      >
                        {calculation?.label || '—'}
                      </div>
                    </div>

                    <div className="relative group">
                      <motion.div
                        key={calculation?.inr}
                        initial={{ scale: 0.92, opacity: 0.4 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="text-[56px] font-extrabold tracking-[-0.03em] text-center tabular-nums leading-none transition-[color] duration-300"
                        style={{ color: calculation?.color || 'var(--primary)' }}
                        aria-live="polite"
                        aria-atomic="true"
                        role="status"
                      >
                        {calculation ? calculation.inr.toFixed(2) : '—'}
                      </motion.div>
                      {calculation && (
                        <button
                          onClick={() => copyIndividual(calculation.inr.toFixed(2), 'inr')}
                          className={`motion-press absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-md border bg-[var(--surface)] transition-[var(--transition)] ${copied === 'inr' ? 'text-[var(--status-normal)] border-[var(--status-normal)] motion-pop' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]'}`}
                          title="Copy INR value"
                          aria-label="Copy INR value to clipboard"
                          disabled={isCopying}
                        >
                          {copied === 'inr' ? <Check size={12} aria-hidden="true" /> : <Clipboard size={12} />}
                        </button>
                      )}
                    </div>

                    <div className="text-center text-[10px] font-mono text-[var(--text-muted)] tracking-[0.05em] mb-4">
                      {calculation ? `(${patientPT} ÷ ${controlPT})^${isi}` : 'Enter values above to calculate'}
                    </div>

                    {/* PT Ratio and Index Display — keyboard-accessible copy buttons */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => calculation && copyIndividual(calculation.ptRatio.toFixed(2), 'ratio')}
                        className={`motion-press bg-[color-mix(in_oklch,var(--surface)_70%,transparent)] border rounded-lg p-3 flex flex-col items-center gap-1 cursor-pointer hover:border-[var(--primary)] hover:bg-[color-mix(in_oklch,var(--surface)_80%,var(--primary))] transition-[var(--transition)] text-left disabled:opacity-50 disabled:cursor-not-allowed ${copied === 'ratio' ? 'border-[var(--status-normal)] motion-pop' : copyError ? 'border-[var(--status-critical)]' : 'border-[var(--border)]'}`}
                        aria-label={copyError ? 'Copy failed — select the value and press Ctrl+C' : 'Copy PT ratio'}
                        disabled={isCopying}
                      >
                        <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-[0.1em]">Ratio</div>
                        <div className="text-[22px] font-bold tabular-nums" style={{ color: calculation?.color || 'var(--text-muted)' }}>
                          {calculation ? calculation.ptRatio.toFixed(2) : '—'}
                        </div>
                        <div aria-live="polite" className={`text-[9px] font-mono mt-1 min-h-[12px] transition-[var(--transition)] ${copied === 'ratio' ? 'text-[var(--status-normal)]' : copyError ? 'text-[var(--status-critical)]' : 'text-transparent'}`}>
                          {copied === 'ratio' ? 'Copied' : copyError ? 'Press Ctrl+C' : '·'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => calculation && copyIndividual(calculation.ptActivity.toFixed(1), 'index')}
                        className={`motion-press bg-[color-mix(in_oklch,var(--surface)_70%,transparent)] border rounded-lg p-3 flex flex-col items-center gap-1 cursor-pointer hover:border-[var(--primary)] hover:bg-[color-mix(in_oklch,var(--surface)_80%,var(--primary))] transition-[var(--transition)] text-left disabled:opacity-50 disabled:cursor-not-allowed ${copied === 'index' ? 'border-[var(--status-normal)] motion-pop' : copyError ? 'border-[var(--status-critical)]' : 'border-[var(--border)]'}`}
                        aria-label={copyError ? 'Copy failed — select the value and press Ctrl+C' : 'Copy PT index'}
                        disabled={isCopying}
                      >
                        <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-[0.1em]">Index %</div>
                        <div className="text-[22px] font-bold tabular-nums" style={{ color: calculation?.color || 'var(--text-muted)' }}>
                          {calculation ? calculation.ptActivity.toFixed(1) : '—'}%
                        </div>
                        <div aria-live="polite" className={`text-[9px] font-mono mt-1 min-h-[12px] transition-[var(--transition)] ${copied === 'index' ? 'text-[var(--status-normal)]' : copyError ? 'text-[var(--status-critical)]' : 'text-transparent'}`}>
                          {copied === 'index' ? 'Copied' : copyError ? 'Press Ctrl+C' : '·'}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Clinical Comment Section — keyboard-accessible */}
                  <AnimatePresence>
                    {calculation?.comment && (
                      <button
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={async () => {
                          if (!calculation) return;
                          setIsCopying(true);
                          const ok = await writeClipboard(calculation.comment);
                          setIsCopying(false);
                          if (ok) { flashCopy('comment'); setStatusMessage('Comment copied to clipboard.'); }
                          else { setCopyError(true); setStatusMessage('Copy failed. Select and press Ctrl+C.'); }
                        }}
                        className="motion-press mt-4 w-full text-left p-3 bg-[var(--tint-comment)] border border-[color-mix(in_oklch,var(--status-comment)_30%,transparent)] rounded-lg cursor-pointer hover:bg-[color-mix(in_oklch,var(--status-comment)_18%,transparent)] transition-[var(--transition)] disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Copy clinical comment"
                        disabled={isCopying}
                      >
                        <div className="text-[9px] font-mono text-[var(--status-comment)] uppercase tracking-[0.1em] mb-1 flex justify-between items-center font-bold">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle size={10} aria-hidden="true" />
                            Clinical Comment
                          </span>
                          <span aria-live="polite" className="flex items-center gap-1 min-w-[60px] justify-end">
                            {isCopying ? <Loader2 size={9} className="motion-spin" aria-hidden="true" /> : copied === 'comment' ? <><Check size={9} aria-hidden="true" /> Copied</> : null}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono leading-relaxed text-[var(--text-soft)] italic">
                          {calculation.comment}
                        </div>
                      </button>
                    )}
                  </AnimatePresence>

                  {calculation && (
                    <div className="mt-[14px]">
                      <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)] mb-[4px]">
                        <span>0</span>
                        <span>Normal</span>
                        <span>High</span>
                        <span>Critical</span>
                        <span>5+</span>
                      </div>
                      <div
                        className="h-[6px] rounded-[3px] relative"
                        style={{ background: `linear-gradient(90deg, var(--status-normal) 0%, var(--status-normal) 25%, var(--status-elevated) 25%, var(--status-elevated) 40%, var(--status-therapeutic) 40%, var(--status-therapeutic) 55%, var(--status-high) 55%, var(--status-high) 75%, var(--status-critical) 75%, var(--status-critical) 100%)` }}
                        role="meter"
                        aria-label={`INR ${calculation.inr.toFixed(2)} on the 0 to 5+ scale`}
                        aria-valuemin={0}
                        aria-valuemax={5}
                        aria-valuenow={Number(calculation.inr.toFixed(2))}
                      >
                        <motion.div
                          className="absolute top-[-4px] w-[14px] h-[14px] rounded-full border-2"
                          style={{
                            background: calculation.color,
                            borderColor: 'var(--surface)',
                            boxShadow: `0 0 8px ${calculation.color}`
                          }}
                          initial={false}
                          animate={{ left: `${Math.min((calculation.inr / 5) * 100, 100)}%` }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons — staggered after the result lands */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.32 }}
                className="grid grid-cols-3 gap-[8px] p-[0_20px_16px]"
              >
                <button
                  onClick={handleCopyAll}
                  className={`motion-press flex flex-col items-center gap-[4px] p-[10px_8px] rounded-[var(--radius-sm)] border bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] font-display text-[11px] font-semibold cursor-pointer transition-[var(--transition)] tracking-[0.03em] hover:text-[var(--text)] hover:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed ${copied === 'all' ? 'bg-[var(--tint-normal)] text-[var(--status-normal)] border-[var(--status-normal)] motion-pop' : copyError ? 'text-[var(--status-critical)] border-[var(--status-critical)]' : 'border-[var(--border)]'}`}
                  aria-label={copyError ? 'Copy failed — select values and press Ctrl+C' : 'Copy all calculated values'}
                  disabled={!calculation || isCopying}
                >
                  {isCopying ? <Loader2 size={16} className="motion-spin" aria-hidden="true" /> : copied === 'all' ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} />}
                  {isCopying ? 'Copying' : copied === 'all' ? 'All Copied' : copyError ? 'Retry' : 'Copy All'}
                </button>
                <button
                  onClick={requestReset}
                  ref={resetButtonRef}
                  aria-label={confirmingReset ? 'Press again to confirm reset' : 'Reset all input fields'}
                  aria-busy={confirmingReset}
                  className={`motion-press flex flex-col items-center gap-[4px] p-[10px_8px] rounded-[var(--radius-sm)] border bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] font-display text-[11px] font-semibold cursor-pointer transition-[var(--transition)] tracking-[0.03em] hover:text-[var(--status-critical)] hover:border-[var(--status-critical)] hover:bg-[var(--tint-critical)] disabled:opacity-50 disabled:cursor-not-allowed ${confirmingReset ? 'border-[var(--status-critical)] text-[var(--status-critical)] bg-[var(--tint-critical)] motion-confirm' : 'border-[var(--border)]'}`}
                  disabled={isCopying}
                >
                  <RotateCcw size={16} />
                  {confirmingReset ? 'Confirm?' : 'Reset'}
                </button>
                <button
                  onClick={() => setHistoryOpen(!historyOpen)}
                  aria-expanded={historyOpen}
                  aria-controls="history-panel"
                  className={`motion-press flex flex-col items-center gap-[4px] p-[10px_8px] rounded-[var(--radius-sm)] border bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] font-display text-[11px] font-semibold cursor-pointer transition-[var(--transition)] tracking-[0.03em] hover:text-[var(--status-elevated)] hover:border-[var(--status-elevated)] ${historyOpen ? 'bg-[var(--tint-elevated)] text-[var(--status-elevated)] border-[var(--status-elevated)]' : 'border-[var(--border)]'}`}
                >
                  <HistoryIcon size={16} />
                  History
                </button>
              </motion.div>

              {/* History Panel */}
              <AnimatePresence>
                {historyOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    id="history-panel"
                    role="region"
                    aria-label="Calculation history"
                    className="mx-[20px] bg-[color-mix(in_oklch,var(--surface)_75%,black)] border border-[var(--border)] rounded-[var(--radius-sm)] mb-[12px] overflow-hidden"
                  >
                    <div className="p-[10px_12px] max-h-[180px] overflow-y-auto">
                      <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-[0.1em] mb-[8px] flex justify-between items-center gap-2">
                        <span>Calculation History <span className="text-[var(--text-muted)]">({history.length})</span></span>
                        {history.length > 0 && (
                          <div className="flex items-center gap-2">
                            {confirmingClear && (
                              <button
                                onClick={cancelClearHistory}
                                className="text-[var(--text-muted)] underline bg-none border-none cursor-pointer font-mono text-[9px] hover:opacity-80"
                                aria-label="Cancel clear history"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={requestClearHistory}
                              ref={clearButtonRef}
                              aria-busy={confirmingClear}
                              aria-label={confirmingClear ? `Press again to confirm clearing ${history.length} entries` : 'Clear all history'}
                              className={`underline bg-none border-none cursor-pointer font-mono text-[9px] hover:opacity-80 ${confirmingClear ? 'text-[var(--status-critical)] font-bold animate-pulse' : 'text-[var(--status-critical)]'}`}
                            >
                              {confirmingClear ? 'Confirm?' : 'Clear'}
                            </button>
                          </div>
                        )}
                      </div>
                      {history.length === 0 ? (
                        <div className="text-[11px] text-[var(--text-muted)] font-mono text-center p-[12px_0] flex flex-col items-center gap-2">
                          <HistoryIcon size={20} className="opacity-40" aria-hidden="true" />
                          <span>No calculations yet</span>
                          <span className="text-[10px] opacity-70">Enter values above to record the first one</span>
                        </div>
                      ) : (
                        history.map((h, i) => (
                          <div
                            key={i}
                            className="group flex items-stretch border-b border-[color-mix(in_oklch,var(--border)_50%,transparent)] last:border-none"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setPatientPT(String(h.ppt));
                                setControlPT(String(h.cpt));
                                setIsi(String(h.isi));
                                setStatusMessage(`Restored entry: PT ${h.ppt}, Control ${h.cpt}, ISI ${h.isi}.`);
                                requestAnimationFrame(() => patientInputRef.current?.focus());
                              }}
                              className="flex-1 text-left flex justify-between items-center p-[6px_4px] font-mono text-[11px] hover:bg-[color-mix(in_oklch,var(--surface)_90%,var(--primary))] active:bg-[color-mix(in_oklch,var(--surface)_85%,var(--primary))] transition-colors cursor-pointer rounded-l"
                              aria-label={`Restore entry: INR ${h.inr} ${h.label}, PT ${h.ppt}, Control ${h.cpt}, ISI ${h.isi}, ${h.time}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-medium" style={{ color: h.color }}>INR {h.inr}</span>
                                  {h.comment && (
                                    <div className="text-[9px] bg-[var(--tint-comment)] text-[var(--status-comment)] px-1.5 py-0.5 rounded border border-[color-mix(in_oklch,var(--status-comment)_30%,transparent)] font-bold tracking-wider flex items-center gap-1">
                                      <AlertTriangle size={9} aria-hidden="true" />
                                      COMMENT
                                    </div>
                                  )}
                                </div>
                                <div className="text-[9px] text-[var(--text-muted)]">PT {h.ppt}s / Ctrl {h.cpt}s / ISI {h.isi}</div>
                                <div className="text-[9px] text-[var(--text-muted)]">Ratio {h.ratio} / Index {h.index}%</div>
                              </div>
                              <div className="text-right pl-2">
                                <div className="text-[10px] font-semibold" style={{ color: h.color }}>{h.label}</div>
                                <div className="text-[9px] text-[var(--text-muted)]">{h.time}</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setHistory((prev) => prev.filter((_, idx) => idx !== i));
                                setStatusMessage(`Removed entry from history.`);
                              }}
                              className="px-2 flex items-center justify-center text-[var(--text-muted)] opacity-60 hover:opacity-100 hover:text-[var(--status-critical)] active:scale-90 motion-press transition-all border-l border-[color-mix(in_oklch,var(--border)_40%,transparent)]"
                              aria-label={`Delete history entry: INR ${h.inr} ${h.label} at ${h.time}`}
                              title="Delete this entry"
                            >
                              <Trash2 size={11} aria-hidden="true" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keyboard Shortcuts */}
              <div className="p-[0_20px_10px] flex gap-[6px] flex-wrap mt-auto" aria-label="Keyboard shortcuts">
                <kbd className="text-[9px] font-mono text-[var(--text-muted)] bg-[color-mix(in_oklch,var(--surface)_92%,transparent)] border border-[var(--border)] rounded-[4px] p-[2px_6px] tracking-[0.03em]">Enter Copy</kbd>
                <kbd className="text-[9px] font-mono text-[var(--text-muted)] bg-[color-mix(in_oklch,var(--surface)_92%,transparent)] border border-[var(--border)] rounded-[4px] p-[2px_6px] tracking-[0.03em]">Esc Reset</kbd>
                <kbd className="text-[9px] font-mono text-[var(--text-muted)] bg-[color-mix(in_oklch,var(--surface)_92%,transparent)] border border-[var(--border)] rounded-[4px] p-[2px_6px] tracking-[0.03em]">↑↓ Fields</kbd>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </main>

        {/* Footer — clinical metadata, not personal contact */}
        <footer className="bg-[color-mix(in_oklch,var(--surface)_75%,black)] border-t border-[var(--border)] p-[10px_20px] text-center">
          <div className="text-[9px] font-mono text-[var(--text-muted)] tracking-[0.05em] uppercase">
            <span className="text-[var(--text-soft)]">INR</span> = (PT ÷ Control PT)<sup className="text-[var(--text-muted)]">ISI</sup>
          </div>
          <div className="text-[9px] font-mono text-[var(--text-muted)] mt-[2px] tracking-[0.03em]">
            v1.0 · for clinical decision support · verify before acting
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
