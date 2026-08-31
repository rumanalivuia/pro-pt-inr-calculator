import React, { RefObject } from 'react';
import { AlertTriangle } from 'lucide-react';

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  error: string | null;
  hint: string;
  unit: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
  primary?: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onChange: (v: string) => void;
}

export default function InputField({
  id,
  label,
  value,
  error,
  hint,
  unit,
  inputRef,
  autoFocus,
  primary,
  onKeyDown,
  onChange,
}: InputFieldProps) {
  const border = error
    ? 'border-[var(--field-error)]'
    : primary
      ? 'border-[var(--primary)]'
      : 'border-[var(--field-border)] focus:border-[var(--field-border-active)]';

  return (
    <div className="flex flex-col gap-[6px]">
      <label
        htmlFor={id}
        className={`text-[10px] font-mono tracking-[0.05em] uppercase ${primary ? 'text-[var(--primary)] font-bold' : 'text-[var(--text-muted)]'}`}
      >
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        className={`bg-[var(--field-bg)] border-[1.5px] rounded-[var(--radius-sm)] text-[var(--text)] font-mono font-medium text-center p-[10px_6px] outline-none w-full transition-[var(--transition)] focus:bg-[var(--field-bg-focus)] ${primary ? 'text-[24px] font-bold p-[12px_6px] border-[2px]' : 'text-[18px]'} ${border}`}
        type="number"
        step="any"
        inputMode="decimal"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={unit === 'index' ? '1.0' : '0.0'}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : `${id}-unit`}
        autoFocus={autoFocus}
      />
      {error ? (
        <div
          id={`${id}-error`}
          role="alert"
          className="text-[9px] font-mono text-[var(--field-error)] text-center tracking-[0.04em] flex items-center justify-center gap-1"
        >
          <AlertTriangle size={9} aria-hidden="true" />
          {error}
        </div>
      ) : (
        <div
          id={`${id}-unit`}
          className={`text-[9px] font-mono text-center tracking-[0.04em] ${primary ? 'text-[var(--primary)] font-medium text-[10px]' : 'text-[var(--text-muted)]'}`}
        >
          {error ? hint : unit}
        </div>
      )}
    </div>
  );
}
