export const calculateAge = () => {
  var t = new Date().valueOf() - new Date(1997, 1).valueOf();
  t /= 1000 * 60 * 60 * 24 * 365;
  return `${Math.floor(t)}.${(t % 1).toFixed(9).substring(2)}`;
};
