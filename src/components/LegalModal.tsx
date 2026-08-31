import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Lock, User } from 'lucide-react';

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LegalModal({ open, onClose }: LegalModalProps) {
  // Close on Escape; focus trap-ish: move focus to close button on open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Medical disclaimer and privacy policy"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_32px_80px_color-mix(in_oklch,black_60%,transparent)] w-full max-w-md max-h-[80vh] overflow-y-auto custom-scrollbar relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-[14px_16px] bg-[color-mix(in_oklch,var(--surface)_85%,transparent)] backdrop-blur-md border-b border-[var(--border)]">
              <h2 className="text-[11px] font-mono text-[var(--text)] uppercase tracking-[0.1em] font-bold">
                Legal &amp; Privacy
              </h2>
              <button
                onClick={onClose}
                className="w-[28px] h-[28px] rounded-[7px] border border-[var(--border)] bg-[color-mix(in_oklch,var(--surface)_95%,transparent)] text-[var(--text-muted)] flex items-center justify-center transition-[var(--transition)] hover:text-[var(--text)] hover:border-[var(--primary)]"
                aria-label="Close legal information"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-[16px] flex flex-col gap-[16px] text-[11px] leading-relaxed text-[var(--text-soft)]">
              {/* Author */}
              <section aria-label="Author information">
                <h3 className="flex items-center gap-2 text-[10px] font-mono text-[var(--primary)] uppercase tracking-[0.1em] font-bold mb-2">
                  <User size={12} aria-hidden="true" /> Author
                </h3>
                <p>
                  Pro PT/INR Calculator is created and maintained by{' '}
                  <a
                    href="https://github.com/rumanalivuia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] underline underline-offset-2 hover:opacity-80"
                  >
                    Ruman Ali Vuia
                  </a>
                  .
                </p>
              </section>

              {/* Medical disclaimer */}
              <section aria-label="Medical disclaimer">
                <h3 className="flex items-center gap-2 text-[10px] font-mono text-[var(--status-comment)] uppercase tracking-[0.1em] font-bold mb-2">
                  <ShieldAlert size={12} aria-hidden="true" /> Medical Disclaimer
                </h3>
                <p>
                  This tool is provided <strong>for reference and education only</strong>. It does
                  not constitute medical advice, diagnosis, or treatment. The INR value and status
                  bands shown here are calculated automatically and may not reflect your specific
                  clinical situation, reagent, or laboratory protocol.
                </p>
                <p>
                  Always follow your institution&apos;s protocols and the advice of a qualified
                  clinician. Never change, start, or stop any medication based on this tool alone.
                  If you have any doubt about a result, repeat the test with a fresh sample and
                  consult your healthcare provider.
                </p>
                <p>
                  In an emergency, contact your local emergency services immediately.
                </p>
              </section>

              {/* Privacy policy */}
              <section aria-label="Privacy policy">
                <h3 className="flex items-center gap-2 text-[10px] font-mono text-[var(--status-normal)] uppercase tracking-[0.1em] font-bold mb-2">
                  <Lock size={12} aria-hidden="true" /> Privacy Policy
                </h3>
                <p>
                  <strong>No personal data is collected, stored, or shared.</strong> All
                  calculations happen locally on your device.
                </p>
                <p>
                  Your input values and calculation history are stored only in your browser&apos;s
                  local storage and never leave your device. Clearing your history or browser data
                  removes them permanently.
                </p>
                <p>
                  This app does not use tracking cookies, analytics, or advertising identifiers.
                </p>
              </section>

              <p className="text-[10px] font-mono text-[var(--text-muted)] text-center border-t border-[var(--border)] pt-[12px]">
                Pro PT/INR Calculator v1.0.1 · MIT License
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
