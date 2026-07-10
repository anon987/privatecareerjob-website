/**
 * Deterministic CTC → in-hand approximation for India (new tax regime,
 * FY 2025-26). The AI estimates market CTC ranges; this converts them to
 * take-home so the money numbers users act on are computed, not hallucinated.
 *
 * Assumptions (stated in the UI): basic = 40% of CTC, employer PF and
 * gratuity inside CTC, employee PF 12% of basic, professional tax ₹2,400/yr,
 * standard deduction ₹75,000, §87A rebate up to ₹12L taxable, 4% cess.
 */

export interface InHandBreakdown {
  annualCtc: number;
  monthlyInHand: number;
  monthlyGross: number;
  basic: number;
  employeePf: number;
  incomeTax: number;
  professionalTax: number;
}

const NEW_REGIME_SLABS: { upTo: number; rate: number }[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

function slabTax(taxable: number): number {
  let tax = 0;
  let prev = 0;
  for (const { upTo, rate } of NEW_REGIME_SLABS) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, upTo) - prev) * rate;
    prev = upTo;
  }
  // §87A rebate: zero tax when taxable income is within ₹12L
  if (taxable <= 1200000) tax = 0;
  return tax * 1.04; // 4% health & education cess
}

export function inHandFromCtc(annualCtc: number): InHandBreakdown {
  const basic = annualCtc * 0.4;
  const employerPf = basic * 0.12;
  const gratuity = basic * 0.0481;
  const gross = Math.max(0, annualCtc - employerPf - gratuity);
  const employeePf = basic * 0.12;
  const professionalTax = 2400;
  const taxable = Math.max(0, gross - 75000);
  const incomeTax = slabTax(taxable);
  const annualInHand = Math.max(0, gross - employeePf - professionalTax - incomeTax);
  return {
    annualCtc: Math.round(annualCtc),
    monthlyInHand: Math.round(annualInHand / 12),
    monthlyGross: Math.round(gross / 12),
    basic: Math.round(basic),
    employeePf: Math.round(employeePf),
    incomeTax: Math.round(incomeTax),
    professionalTax,
  };
}

export function formatInr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
