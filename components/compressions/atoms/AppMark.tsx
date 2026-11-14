interface Props {
  size?: number | string;
  className?: string;
}

const FOOT = "M240 360 L140 180 Q192 208 240 136 Q288 208 340 180 Z";

/**
 * The Compressions app icon as of 1.4.0: two duck feet in the app's gold on
 * its dark background. Same drawing as the repo's icon.svg.
 */
const AppMark = ({ size = 48, className = "" }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 480 480"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Compressions app icon"
  >
    <rect width="480" height="480" rx="106" fill="#0e0e10" />
    <g
      transform="translate(240 240) scale(1.3) translate(-240 -240)"
      fill="#d4a053"
      stroke="#d4a053"
      strokeWidth="26"
      strokeLinejoin="round"
    >
      <path
        transform="matrix(0.533663 -0.133057 0.133057 0.533663 -1.07719 209.585)"
        d={FOOT}
      />
      <path
        transform="matrix(0.533663 0.133057 -0.133057 0.533663 224.919 5.71797)"
        d={FOOT}
      />
    </g>
  </svg>
);

export default AppMark;
