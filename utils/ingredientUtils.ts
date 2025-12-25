// Helpers for parsing and combining ingredient amounts

export const parseLeadingAmount = (amount: string): { value: number; rest: string } | null => {
  if (!amount || typeof amount !== 'string') return null;
  const trimmed = amount.trim();
  const match = trimmed.match(/^([0-9]+\s+[0-9]+\/[0-9]+|[0-9]+\/[0-9]+|[0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) return null;
  const numStr = match[1].trim();
  const rest = match[2] ? match[2].trim() : '';

  let value = 0;
  if (numStr.includes(' ')) {
    const parts = numStr.split(' ');
    const whole = parseInt(parts[0], 10);
    const frac = parts[1].split('/');
    value = whole + parseInt(frac[0], 10) / parseInt(frac[1], 10);
  } else if (numStr.includes('/')) {
    const frac = numStr.split('/');
    value = parseInt(frac[0], 10) / parseInt(frac[1], 10);
  } else {
    value = parseFloat(numStr);
  }

  if (Number.isNaN(value)) return null;
  return { value, rest };
};

// Format as mixed fraction up to denominator 8
export const formatAmount = (value: number, rest: string) => {
  const denom = 8;
  const sign = value < 0 ? -1 : 1;
  value = Math.abs(value);
  const whole = Math.floor(value);
  let frac = value - whole;
  const rounded = Math.round(frac * denom) / denom;
  if (rounded === 1) {
    return `${sign * (whole + 1)}${rest ? ' ' + rest : ''}`;
  }
  const fracNumer = Math.round(rounded * denom);
  if (fracNumer === 0) {
    return `${sign * whole}${rest ? ' ' + rest : ''}`;
  }
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(fracNumer, denom);
  const num = fracNumer / g;
  const den = denom / g;
  if (whole === 0) {
    return `${sign * 1 === -1 ? '-' : ''}${num}/${den}${rest ? ' ' + rest : ''}`;
  }
  return `${sign * whole} ${num}/${den}${rest ? ' ' + rest : ''}`;
};

export const addAmounts = (a: string, b: string): string | null => {
  const pa = parseLeadingAmount(a);
  const pb = parseLeadingAmount(b);
  if (!pa && !pb) return null;
  if (pa && pb && pa.rest.toLowerCase() === pb.rest.toLowerCase()) {
    const sum = pa.value + pb.value;
    return formatAmount(sum, pa.rest);
  }
  // If rest differs or only one has numeric amount, prefer combining to comma-separated fallback
  if (pa && !pb) return a;
  if (!pa && pb) return b;
  return null;
};
