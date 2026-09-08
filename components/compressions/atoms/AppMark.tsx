interface Props {
  size?: number | string;
  className?: string;
}

/**
 * The Compressions app icon as of 1.2.0: a chevron bearing down on a slab,
 * pressing it thinner. Same drawing as the repo's icon.svg.
 */
const AppMark = ({ size = 48, className = "" }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Compressions app icon"
  >
    <rect width="100" height="100" rx="22" fill="#0e0e10" />
    <polyline
      points="20,22 50,50 80,22"
      fill="none"
      stroke="#d4a053"
      strokeWidth="13"
      strokeLinejoin="miter"
      strokeLinecap="butt"
    />
    <rect x="20" y="66" width="60" height="9" fill="#d4a053" />
    <rect x="30" y="80" width="40" height="6" fill="#d4a053" />
  </svg>
);

export default AppMark;
