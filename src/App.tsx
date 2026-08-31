/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateINR, validateINR, type FieldErrors } from './lib/inr';
import TitleBar from './components/TitleBar';
import ResultCard, { type CopiedKey } from './components/ResultCard';
import HistoryPanel from './components/HistoryPanel';
import MinimizedBar from './components/MinimizedBar';
import ActionButtons from './components/ActionButtons';
import InputField from './components/InputField';
import LegalModal from './components/LegalModal';

export interface HistoryEntry {
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

export default function App() {
  const [patientPT, setPatientPT] = useState<string>('');
  const [controlPT, setControlPT] = useState<string>('');
  const [isi, setIsi] = useState<string>('');
  const [isDark, setIsDark] = useState(true);
  const [isFloat, setIsFloat] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState<CopiedKey | null>(null);
  const [copyError, setCopyError] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errors, setErrors] = useState<FieldErrors>({ patientPT: null, controlPT: null, isi: null });
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);
  const [confirmingClear, setConfirmingClear] = useState<boolean>(false);
  const [legalOpen, setLegalOpen] = useState<boolean>(false);
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

  // Electron IPC helper — goes through the whitelisted preload bridge.
  const sendToElectron = (channel: string, data?: any) => {
    (window as any).electronAPI?.send(channel, data);
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

  const calculation = useMemo(
    () =>
      calculateINR({
        patientPT: parseFloat(patientPT),
        controlPT: parseFloat(controlPT),
        isi: parseFloat(isi),
      }),
    [patientPT, controlPT, isi]
  );

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

  const flashCopy = (key: CopiedKey) => {
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

  const copyComment = async () => {
    if (!calculation || isCopying) return;
    setIsCopying(true);
    const ok = await writeClipboard(calculation.comment ?? '');
    setIsCopying(false);
    if (ok) {
      flashCopy('comment');
      setStatusMessage('Comment copied to clipboard.');
    } else {
      setCopyError(true);
      setStatusMessage('Copy failed. Select and press Ctrl+C.');
    }
  };

  // Re-validate as the user types
  useEffect(() => {
    setErrors(validateINR(patientPT, controlPT, isi));
  }, [patientPT, controlPT, isi]);

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

  const toggleFloat = () => {
    setIsFloat(!isFloat);
    if (!isFloat) setPosition({ x: 0, y: 0 });
  };

  const restoreHistory = (h: HistoryEntry) => {
    setPatientPT(String(h.ppt));
    setControlPT(String(h.cpt));
    setIsi(String(h.isi));
    setStatusMessage(`Restored entry: PT ${h.ppt}, Control ${h.cpt}, ISI ${h.isi}.`);
    requestAnimationFrame(() => patientInputRef.current?.focus());
  };

  const deleteHistory = (i: number) => {
    setHistory((prev) => prev.filter((_, idx) => idx !== i));
    setStatusMessage(`Removed entry from history.`);
  };

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
        <TitleBar
          isDark={isDark}
          isFloat={isFloat}
          isMinimized={isMinimized}
          showInstall={!!deferredPrompt}
          onToggleTheme={() => setIsDark(!isDark)}
          onInstall={handleInstall}
          onToggleFloat={toggleFloat}
          onMinimize={() => sendToElectron('minimize-window')}
          onToggleMinimized={() => setIsMinimized(!isMinimized)}
          onClose={() => sendToElectron('close-window')}
        />

        <main id="main" className="flex-1 flex flex-col min-h-0" aria-label="PT/INR calculator">
        <AnimatePresence mode="wait">
          {isMinimized ? (
            <MinimizedBar
              key="minimized"
              calculation={calculation}
              onMinimize={() => sendToElectron('minimize-window')}
              onRestore={() => setIsMinimized(false)}
            />
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
                    <InputField
                      id="control-pt"
                      label="Control PT"
                      value={controlPT}
                      error={errors.controlPT}
                      hint=""
                      unit="seconds"
                      inputRef={controlInputRef}
                      onChange={setControlPT}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); patientInputRef.current?.focus(); }
                        if (e.key === 'ArrowDown') { e.preventDefault(); patientInputRef.current?.focus(); }
                        if (e.key === 'ArrowUp') { e.preventDefault(); isiInputRef.current?.focus(); }
                      }}
                    />
                    <InputField
                      id="isi"
                      label="ISI"
                      value={isi}
                      error={errors.isi}
                      hint=""
                      unit="index"
                      inputRef={isiInputRef}
                      onChange={setIsi}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); patientInputRef.current?.focus(); }
                        if (e.key === 'ArrowUp') { e.preventDefault(); controlInputRef.current?.focus(); }
                      }}
                    />
                  </motion.div>

                  {/* Row 2: Patient PT (Highlighted) — larger entrance, lands last */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
                    className="flex flex-col gap-[6px]"
                  >
                    <InputField
                      id="patient-pt"
                      label="Patient PT (Active Input)"
                      value={patientPT}
                      error={errors.patientPT}
                      hint="Enter patient's PT value here"
                      unit=""
                      inputRef={patientInputRef}
                      autoFocus
                      primary
                      onChange={setPatientPT}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleCopyAll(); }
                        if (e.key === 'ArrowUp') { e.preventDefault(); controlInputRef.current?.focus(); }
                      }}
                    />
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
                <ResultCard
                  calculation={calculation}
                  patientPT={patientPT}
                  controlPT={controlPT}
                  isi={isi}
                  copied={copied}
                  copyError={copyError}
                  isCopying={isCopying}
                  onCopyAll={handleCopyAll}
                  onCopyInr={() => calculation && copyIndividual(calculation.inr.toFixed(2), 'inr')}
                  onCopyRatio={() => calculation && copyIndividual(calculation.ptRatio.toFixed(2), 'ratio')}
                  onCopyIndex={() => calculation && copyIndividual(calculation.ptActivity.toFixed(1), 'index')}
                  onCopyComment={copyComment}
                />
              </div>

              {/* Action Buttons — staggered after the result lands */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.32 }}
              >
                <ActionButtons
                  canCopy={!!calculation}
                  isCopying={isCopying}
                  copied={copied}
                  copyError={copyError}
                  confirmingReset={confirmingReset}
                  historyOpen={historyOpen}
                  onCopyAll={handleCopyAll}
                  onReset={requestReset}
                  onToggleHistory={() => setHistoryOpen(!historyOpen)}
                />
              </motion.div>

              {/* History Panel */}
              <AnimatePresence>
                {historyOpen && (
                  <HistoryPanel
                    key="history"
                    history={history}
                    confirmingClear={confirmingClear}
                    onRestore={restoreHistory}
                    onDelete={deleteHistory}
                    onClear={requestClearHistory}
                    onCancelClear={cancelClearHistory}
                  />
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
            v1.0.1 · for clinical decision support · verify before acting
          </div>
          <button
            onClick={() => setLegalOpen(true)}
            className="text-[9px] font-mono text-[var(--text-muted)] underline underline-offset-2 mt-[4px] hover:text-[var(--primary)] transition-colors cursor-pointer"
            aria-label="Open medical disclaimer and privacy policy"
          >
            Disclaimer · Privacy · Author
          </button>
          <span className="text-[9px] font-mono text-[var(--text-muted)] mt-[4px]">·</span>
          <a
            href="https://github.com/sponsors/rumanalivuia"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-mono text-[var(--text-muted)] underline underline-offset-2 mt-[4px] hover:text-[var(--status-comment)] transition-colors"
            aria-label="Support this project on GitHub Sponsors"
          >
            ♥ Support
          </a>
        </footer>

        <LegalModal open={legalOpen} onClose={() => setLegalOpen(false)} />
      </motion.div>
    </div>
  );
}
