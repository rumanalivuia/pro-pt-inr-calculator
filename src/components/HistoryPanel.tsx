import React from 'react';
import { motion } from 'motion/react';
import { History as HistoryIcon, Trash2, AlertTriangle } from 'lucide-react';
import type { HistoryEntry } from '../App';

interface HistoryPanelProps {
  key?: React.Key;
  history: HistoryEntry[];
  confirmingClear: boolean;
  onRestore: (h: HistoryEntry) => void;
  onDelete: (index: number) => void;
  onClear: () => void;
  onCancelClear: () => void;
}

export default function HistoryPanel({
  history,
  confirmingClear,
  onRestore,
  onDelete,
  onClear,
  onCancelClear,
}: HistoryPanelProps) {
  return (
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
                  onClick={onCancelClear}
                  className="text-[var(--text-muted)] underline bg-none border-none cursor-pointer font-mono text-[9px] hover:opacity-80"
                  aria-label="Cancel clear history"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={onClear}
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
                onClick={() => onRestore(h)}
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
                onClick={() => onDelete(i)}
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
  );
}
