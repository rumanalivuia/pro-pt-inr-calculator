import React from 'react';
import { Activity, Sun, Moon, Pin, Minus, Minimize2, Maximize2, X } from 'lucide-react';

interface TitleBarProps {
  isDark: boolean;
  isFloat: boolean;
  isMinimized: boolean;
  showInstall: boolean;
  onToggleTheme: () => void;
  onInstall: () => void;
  onToggleFloat: () => void;
  onMinimize: () => void;
  onToggleMinimized: () => void;
  onClose: () => void;
}

export default function TitleBar({
  isDark,
  isFloat,
  isMinimized,
  showInstall,
  onToggleTheme,
  onInstall,
  onToggleFloat,
  onMinimize,
  onToggleMinimized,
  onClose,
}: TitleBarProps) {
  return (
    <div className="flex items-center justify-between p-[12px_16px] bg-[color-mix(in_oklch,var(--surface)_85%,black)] border-b border-[var(--border)] select-none drag-region">
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
          onClick={onToggleTheme}
          className={`w-[28px] h-[28px] rounded-[7px] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] flex items-center justify-center transition-[var(--transition)] hover:text-[var(--text)] hover:border-[var(--primary)] ${!isDark ? 'bg-[var(--tint-elevated)] text-[var(--status-elevated)] border-[var(--status-elevated)]' : ''}`}
          title="Toggle Theme"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        {showInstall && (
          <button
            onClick={onInstall}
            className="w-[28px] h-[28px] rounded-[7px] border border-[var(--primary)] bg-[var(--tint-primary)] text-[var(--primary)] flex items-center justify-center transition-[var(--transition)] hover:bg-[color-mix(in_oklch,var(--primary)_22%,transparent)]"
            title="Install App"
            aria-label="Install as application"
          >
            <Activity size={14} className="animate-pulse" />
          </button>
        )}
        <button
          onClick={onToggleFloat}
          className={`w-[28px] h-[28px] rounded-[7px] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] flex items-center justify-center transition-[var(--transition)] hover:text-[var(--text)] hover:border-[var(--primary)] ${isFloat ? 'bg-[var(--tint-primary)] text-[var(--primary)] border-[var(--primary)]' : ''}`}
          aria-label={isFloat ? 'Unpin from always-on-top' : 'Pin as always-on-top'}
          aria-pressed={isFloat}
        >
          <Pin size={14} className={isFloat ? 'fill-current' : ''} />
        </button>
        <button
          onClick={onMinimize}
          className="hit-area w-[28px] h-[28px] rounded-[7px] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] flex items-center justify-center transition-[var(--transition)] hover:text-[var(--text)] hover:border-[var(--primary)]"
          title="Minimize to Taskbar"
          aria-label="Minimize to taskbar"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={onToggleMinimized}
          className="hit-area w-[28px] h-[28px] rounded-[7px] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] flex items-center justify-center transition-[var(--transition)] hover:text-[var(--text)] hover:border-[var(--primary)]"
          aria-label={isMinimized ? 'Restore window' : 'Minimize to compact view'}
          aria-pressed={isMinimized}
        >
          {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </button>
        <button
          onClick={onClose}
          className="hit-area w-[28px] h-[28px] rounded-[7px] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] flex items-center justify-center transition-[var(--transition)] hover:bg-[var(--tint-critical)] hover:text-[var(--status-critical)] hover:border-[var(--status-critical)]"
          title="Close"
          aria-label="Close application"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
