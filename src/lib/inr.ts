export type StatusLabel =
  | 'Low'
  | 'Normal'
  | 'Elevated'
  | 'Therapeutic'
  | 'High'
  | 'Very High'
  | 'CRITICAL';

export type FieldErrors = {
  patientPT: string | null;
  controlPT: string | null;
  isi: string | null;
};

export interface CalcInput {
  patientPT: number;
  controlPT: number;
  isi: number;
}

export interface CalcResult {
  inr: number;
  ptRatio: number;
  ptActivity: number;
  label: StatusLabel;
  color: string;
  glow: string;
  comment: string | null;
}

/**
 * INR = (Patient PT / Control PT) ^ ISI
 *
 * Returns null when any input is missing, NaN, or not strictly positive.
 * Status bands and color tokens mirror the original App.tsx logic exactly.
 */
export function calculateINR({ patientPT, controlPT, isi }: CalcInput): CalcResult | null {
  if (
    isNaN(patientPT) ||
    isNaN(controlPT) ||
    isNaN(isi) ||
    patientPT <= 0 ||
    controlPT <= 0 ||
    isi <= 0
  ) {
    return null;
  }

  const inr = Math.pow(patientPT / controlPT, isi);
  const ptRatio = patientPT / controlPT;
  const ptActivity = (controlPT / patientPT) * 100;

  let label: StatusLabel = 'Normal';
  let color = 'var(--status-normal)';
  let glow = 'var(--tint-normal)';
  let comment: string | null = null;

  if (inr < 0.8) {
    label = 'Low'; color = 'var(--status-low)'; glow = 'var(--tint-low)';
  } else if (inr <= 1.2) {
    label = 'Normal'; color = 'var(--status-normal)'; glow = 'var(--tint-normal)';
  } else {
    comment = 'PT value is significantly elevated, test may be repeated with fresh sample if clinical condition suggests.';
    if (inr <= 2.0)        { label = 'Elevated';    color = 'var(--status-elevated)';    glow = 'var(--tint-elevated)'; }
    else if (inr <= 3.0)   { label = 'Therapeutic'; color = 'var(--status-therapeutic)'; glow = 'var(--tint-therapeutic)'; }
    else if (inr <= 4.0)   { label = 'High';        color = 'var(--status-high)';        glow = 'var(--tint-high)'; }
    else if (inr <= 5.0)   { label = 'Very High';   color = 'var(--status-critical)';   glow = 'var(--tint-critical)'; }
    else                   { label = 'CRITICAL';    color = 'var(--status-critical)';   glow = 'var(--tint-critical)'; }
  }

  return { inr, ptRatio, ptActivity, label, color, glow, comment };
}

/**
 * Field-level validation for the three text inputs. Empty fields are valid;
 * non-empty fields must parse to a number strictly greater than zero.
 */
export function validateINR(patientPT: string, controlPT: string, isi: string): FieldErrors {
  const next: FieldErrors = { patientPT: null, controlPT: null, isi: null };
  const pptN = parseFloat(patientPT);
  const cptN = parseFloat(controlPT);
  const isiN = parseFloat(isi);

  if (patientPT.trim() !== '' && (isNaN(pptN) || pptN <= 0)) {
    next.patientPT = 'Patient PT must be greater than 0.';
  }
  if (controlPT.trim() !== '' && (isNaN(cptN) || cptN <= 0)) {
    next.controlPT = 'Control PT must be greater than 0.';
  }
  if (isi.trim() !== '' && (isNaN(isiN) || isiN <= 0)) {
    next.isi = 'ISI must be greater than 0.';
  }
  return next;
}
