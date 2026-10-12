export const BIRTH_DATE = new Date(1997, 0, 30);
const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

const yearsSinceBirth = (now: number) =>
  (now - BIRTH_DATE.getTime()) / MS_PER_YEAR;

export const calculateAge = (): string => {
  const t = yearsSinceBirth(Date.now());
  return `${Math.floor(t)}.${(t % 1).toFixed(8).substring(2)}`;
};

/** Whole-number age, used for the `{age}` placeholder in the About bio. */
export const ageInYears = (now: number = Date.now()): number =>
  Math.floor(yearsSinceBirth(now));
