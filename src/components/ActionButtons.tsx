import React from 'react';
import { Clipboard, Check, Loader2, RotateCcw, History as HistoryIcon } from 'lucide-react';
import type { CopiedKey } from './ResultCard';

interface ActionButtonsProps {
  canCopy: boolean;
  isCopying: boolean;
  copied: CopiedKey | null;
  copyError: boolean;
  confirmingReset: boolean;
  historyOpen: boolean;
  onCopyAll: () => void;
  onReset: () => void;
  onToggleHistory: () => void;
}

export default function ActionButtons({
  canCopy,
  isCopying,
  copied,
  copyError,
  confirmingReset,
  historyOpen,
  onCopyAll,
  onReset,
  onToggleHistory,
}: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-[8px] p-[0_20px_16px]">
      <button
        onClick={onCopyAll}
        className={`motion-press flex flex-col items-center gap-[4px] p-[10px_8px] rounded-[var(--radius-sm)] border bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] font-display text-[11px] font-semibold cursor-pointer transition-[var(--transition)] tracking-[0.03em] hover:text-[var(--text)] hover:border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed ${copied === 'all' ? 'bg-[var(--tint-normal)] text-[var(--status-normal)] border-[var(--status-normal)] motion-pop' : copyError ? 'text-[var(--status-critical)] border-[var(--status-critical)]' : 'border-[var(--border)]'}`}
        aria-label={copyError ? 'Copy failed — select values and press Ctrl+C' : 'Copy all calculated values'}
        disabled={!canCopy || isCopying}
      >
        {isCopying ? <Loader2 size={16} className="motion-spin" aria-hidden="true" /> : copied === 'all' ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} />}
        {isCopying ? 'Copying' : copied === 'all' ? 'All Copied' : copyError ? 'Retry' : 'Copy All'}
      </button>
      <button
        onClick={onReset}
        aria-label={confirmingReset ? 'Press again to confirm reset' : 'Reset all input fields'}
        aria-busy={confirmingReset}
        className={`motion-press flex flex-col items-center gap-[4px] p-[10px_8px] rounded-[var(--radius-sm)] border bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] font-display text-[11px] font-semibold cursor-pointer transition-[var(--transition)] tracking-[0.03em] hover:text-[var(--status-critical)] hover:border-[var(--status-critical)] hover:bg-[var(--tint-critical)] disabled:opacity-50 disabled:cursor-not-allowed ${confirmingReset ? 'border-[var(--status-critical)] text-[var(--status-critical)] bg-[var(--tint-critical)] motion-confirm' : 'border-[var(--border)]'}`}
        disabled={isCopying}
      >
        <RotateCcw size={16} />
        {confirmingReset ? 'Confirm?' : 'Reset'}
      </button>
      <button
        onClick={onToggleHistory}
        aria-expanded={historyOpen}
        aria-controls="history-panel"
        className={`motion-press flex flex-col items-center gap-[4px] p-[10px_8px] rounded-[var(--radius-sm)] border bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] font-display text-[11px] font-semibold cursor-pointer transition-[var(--transition)] tracking-[0.03em] hover:text-[var(--status-elevated)] hover:border-[var(--status-elevated)] ${historyOpen ? 'bg-[var(--tint-elevated)] text-[var(--status-elevated)] border-[var(--status-elevated)]' : 'border-[var(--border)]'}`}
      >
        <HistoryIcon size={16} />
        History
      </button>
    </div>
  );
}
