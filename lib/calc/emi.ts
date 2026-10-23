export type EmiResult = {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  /** Per-year totals for the amortisation chart. */
  years: { year: number; principal: number; interest: number; balance: number }[];
};

/**
 * Reducing-balance EMI: EMI = P·r·(1+r)^n / ((1+r)^n − 1), where r is the monthly rate.
 * Values are kept unrounded internally; round only for display.
 */
export function calculateEmi(principal: number, annualRatePct: number, months: number): EmiResult {
  if (!(principal > 0) || !(months > 0) || !Number.isInteger(months) || annualRatePct < 0) {
    throw new RangeError('Principal and months must be positive; rate cannot be negative');
  }
  const r = annualRatePct / 12 / 100;
  const emi = r === 0 ? principal / months : (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1);

  const years: EmiResult['years'] = [];
  let balance = principal;
  let yp = 0;
  let yi = 0;
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const principalPart = emi - interest;
    balance = Math.max(balance - principalPart, 0);
    yp += principalPart;
    yi += interest;
    if (m % 12 === 0 || m === months) {
      years.push({ year: Math.ceil(m / 12), principal: yp, interest: yi, balance });
      yp = 0;
      yi = 0;
    }
  }

  const totalPayment = emi * months;
  return { emi, totalPayment, totalInterest: totalPayment - principal, years };
}
