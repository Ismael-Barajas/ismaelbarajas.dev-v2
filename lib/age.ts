const BIRTH_DATE = new Date(1997, 0, 30);
const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

export const calculateAge = (): string => {
  const t = (Date.now() - BIRTH_DATE.getTime()) / MS_PER_YEAR;
  return `${Math.floor(t)}.${(t % 1).toFixed(8).substring(2)}`;
};
