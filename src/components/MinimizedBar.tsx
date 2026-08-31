import React from 'react';
import { motion } from 'motion/react';
import { Minus, Maximize2 } from 'lucide-react';
import type { CalcResult } from '../lib/inr';

interface MinimizedBarProps {
  key?: React.Key;
  calculation: CalcResult | null;
  onMinimize: () => void;
  onRestore: () => void;
}

export default function MinimizedBar({ calculation, onMinimize, onRestore }: MinimizedBarProps) {
  return (
    <motion.div
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
          onClick={onMinimize}
          className="w-5 h-5 rounded-md bg-[color-mix(in_oklch,var(--surface)_92%,transparent)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[color-mix(in_oklch,var(--surface)_85%,transparent)] hover:text-[var(--text)] transition-all"
          title="Minimize to Taskbar"
          aria-label="Minimize to taskbar"
        >
          <Minus size={10} />
        </button>
        <button
          onClick={onRestore}
          className="w-5 h-5 rounded-md bg-[color-mix(in_oklch,var(--surface)_92%,transparent)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[color-mix(in_oklch,var(--surface)_85%,transparent)] hover:text-[var(--text)] transition-all"
          aria-label="Restore window"
        >
          <Maximize2 size={10} />
        </button>
      </div>
    </motion.div>
  );
}
