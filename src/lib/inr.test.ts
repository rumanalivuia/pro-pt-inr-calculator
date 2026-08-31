import { describe, it, expect } from 'vitest';
import { calculateINR, validateINR } from './inr';

describe('calculateINR', () => {
  it('computes the formula INR = (PT / Control PT) ^ ISI', () => {
    // 24 / 12 = 2.0, 2.0^1.0 = 2.0
    const r = calculateINR({ patientPT: 24, controlPT: 12, isi: 1 });
    expect(r).not.toBeNull();
    expect(r!.inr).toBeCloseTo(2.0, 10);
    expect(r!.ptRatio).toBeCloseTo(2.0, 10);
    expect(r!.ptActivity).toBeCloseTo(50.0, 10);
  });

  it('applies the ISI exponent', () => {
    // 24 / 12 = 2.0, 2.0^2.0 = 4.0
    const r = calculateINR({ patientPT: 24, controlPT: 12, isi: 2 });
    expect(r!.inr).toBeCloseTo(4.0, 10);
  });

  it('handles sub-normal ratios (PT below control)', () => {
    const r = calculateINR({ patientPT: 10, controlPT: 12, isi: 1 });
    expect(r!.inr).toBeCloseTo(0.8333, 3);
    expect(r!.ptActivity).toBeCloseTo(120.0, 10);
  });

  describe('status bands', () => {
    it('labels INR < 0.8 as Low', () => {
      expect(calculateINR({ patientPT: 9, controlPT: 12, isi: 1 })!.label).toBe('Low');
    });

    it('labels INR 0.8–1.2 as Normal', () => {
      // exact boundary 0.8 — 0.8 * 12 = 9.600000000000001 (floats just above 0.8)
      const atLow = calculateINR({ patientPT: 0.8 * 12, controlPT: 12, isi: 1 })!;
      expect(atLow.inr).toBeGreaterThan(0.8);
      expect(atLow.label).toBe('Normal');

      const mid = calculateINR({ patientPT: 12, controlPT: 12, isi: 1 })!;
      expect(mid.label).toBe('Normal');

      // exact boundary 1.2
      const atHigh = calculateINR({ patientPT: 14.4, controlPT: 12, isi: 1 })!;
      expect(atHigh.inr).toBeCloseTo(1.2, 10);
      expect(atHigh.label).toBe('Normal');
    });

    it('labels INR 1.2–2.0 as Elevated', () => {
      const r = calculateINR({ patientPT: 18, controlPT: 12, isi: 1 })!;
      expect(r.inr).toBeCloseTo(1.5, 10);
      expect(r.label).toBe('Elevated');

      // exact boundary 2.0
      const at2 = calculateINR({ patientPT: 24, controlPT: 12, isi: 1 })!;
      expect(at2.inr).toBeCloseTo(2.0, 10);
      expect(at2.label).toBe('Elevated');
    });

    it('labels INR 2.0–3.0 as Therapeutic', () => {
      const r = calculateINR({ patientPT: 30, controlPT: 12, isi: 1 })!;
      expect(r.inr).toBeCloseTo(2.5, 10);
      expect(r.label).toBe('Therapeutic');

      const at3 = calculateINR({ patientPT: 36, controlPT: 12, isi: 1 })!;
      expect(at3.inr).toBeCloseTo(3.0, 10);
      expect(at3.label).toBe('Therapeutic');
    });

    it('labels INR 3.0–4.0 as High', () => {
      const r = calculateINR({ patientPT: 42, controlPT: 12, isi: 1 })!;
      expect(r.inr).toBeCloseTo(3.5, 10);
      expect(r.label).toBe('High');

      const at4 = calculateINR({ patientPT: 48, controlPT: 12, isi: 1 })!;
      expect(at4.inr).toBeCloseTo(4.0, 10);
      expect(at4.label).toBe('High');
    });

    it('labels INR 4.0–5.0 as Very High', () => {
      const r = calculateINR({ patientPT: 54, controlPT: 12, isi: 1 })!;
      expect(r.inr).toBeCloseTo(4.5, 10);
      expect(r.label).toBe('Very High');

      const at5 = calculateINR({ patientPT: 60, controlPT: 12, isi: 1 })!;
      expect(at5.inr).toBeCloseTo(5.0, 10);
      expect(at5.label).toBe('Very High');
    });

    it('labels INR > 5.0 as CRITICAL', () => {
      const r = calculateINR({ patientPT: 72, controlPT: 12, isi: 1 })!;
      expect(r.inr).toBeCloseTo(6.0, 10);
      expect(r.label).toBe('CRITICAL');
    });
  });

  describe('clinical comment', () => {
    it('adds a comment only when INR > 1.2', () => {
      expect(calculateINR({ patientPT: 12, controlPT: 12, isi: 1 })!.comment).toBeNull();
      expect(calculateINR({ patientPT: 14.4, controlPT: 12, isi: 1 })!.comment).toBeNull();
      const elevated = calculateINR({ patientPT: 15, controlPT: 12, isi: 1 })!;
      expect(elevated.comment).toMatch(/significantly elevated/);
    });
  });

  describe('invalid inputs', () => {
    it('returns null when values are missing or NaN', () => {
      expect(calculateINR({ patientPT: NaN, controlPT: 12, isi: 1 })).toBeNull();
      expect(calculateINR({ patientPT: 24, controlPT: NaN, isi: 1 })).toBeNull();
      expect(calculateINR({ patientPT: 24, controlPT: 12, isi: NaN })).toBeNull();
    });

    it('returns null for zero or negative inputs', () => {
      expect(calculateINR({ patientPT: 0, controlPT: 12, isi: 1 })).toBeNull();
      expect(calculateINR({ patientPT: 24, controlPT: 0, isi: 1 })).toBeNull();
      expect(calculateINR({ patientPT: 24, controlPT: 12, isi: 0 })).toBeNull();
      expect(calculateINR({ patientPT: -5, controlPT: 12, isi: 1 })).toBeNull();
      expect(calculateINR({ patientPT: 24, controlPT: -5, isi: 1 })).toBeNull();
      expect(calculateINR({ patientPT: 24, controlPT: 12, isi: -1 })).toBeNull();
    });
  });
});

describe('validateINR', () => {
  it('returns no errors for empty fields', () => {
    expect(validateINR('', '', '')).toEqual({ patientPT: null, controlPT: null, isi: null });
  });

  it('returns no errors for valid positive values', () => {
    expect(validateINR('24.5', '12', '1.1')).toEqual({ patientPT: null, controlPT: null, isi: null });
  });

  it('flags non-numeric input', () => {
    const e = validateINR('abc', '12', '1');
    expect(e.patientPT).toMatch(/greater than 0/);
    expect(e.controlPT).toBeNull();
    expect(e.isi).toBeNull();
  });

  it('flags zero and negative input per field', () => {
    const e = validateINR('0', '-12', '0');
    expect(e.patientPT).toMatch(/greater than 0/);
    expect(e.controlPT).toMatch(/greater than 0/);
    expect(e.isi).toMatch(/greater than 0/);
  });

  it('treats whitespace-only as empty', () => {
    expect(validateINR('   ', '', '')).toEqual({ patientPT: null, controlPT: null, isi: null });
  });
});
