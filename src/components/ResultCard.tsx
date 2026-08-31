import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clipboard, Check, Loader2, AlertTriangle } from 'lucide-react';
import type { CalcResult } from '../lib/inr';

export type CopiedKey = 'inr' | 'ratio' | 'index' | 'all' | 'comment';

interface ResultCardProps {
  calculation: CalcResult | null;
  patientPT: string;
  controlPT: string;
  isi: string;
  copied: CopiedKey | null;
  copyError: boolean;
  isCopying: boolean;
  onCopyAll: () => void;
  onCopyInr: () => void;
  onCopyRatio: () => void;
  onCopyIndex: () => void;
  onCopyComment: () => void;
}

export default function ResultCard({
  calculation,
  patientPT,
  controlPT,
  isi,
  copied,
  copyError,
  isCopying,
  onCopyAll,
  onCopyInr,
  onCopyRatio,
  onCopyIndex,
  onCopyComment,
}: ResultCardProps) {
  return (
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
              onClick={onCopyInr}
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
            onClick={onCopyRatio}
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
            onClick={onCopyIndex}
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
            onClick={onCopyComment}
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
  );
}
