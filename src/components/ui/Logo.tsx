import { cx } from './index';

export interface LogoIconProps {
  size?: number | string;
  className?: string;
  idSuffix?: string;
}

/**
 * LeadBro Brand Mark Icon
 * An iconic, high-tech monogram of 'L' and 'B' forming a forward-surging lead beacon.
 */
export function LogoIcon({ size = 24, className, idSuffix = '' }: LogoIconProps) {
  const bgGradId = `lb-bg-${idSuffix}`;
  const brandGradId = `lb-brand-${idSuffix}`;
  const glowGradId = `lb-glow-${idSuffix}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cx('shrink-0 select-none transition-transform duration-200 hover:scale-[1.03]', className)}
      aria-label="LeadBro Logo"
    >
      <defs>
        <linearGradient id={bgGradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B2B27" />
          <stop offset="100%" stopColor="#041816" />
        </linearGradient>
        <linearGradient id={brandGradId} x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id={glowGradId} x1="12" y1="6" x2="26" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>

      {/* Rounded Squircle Container */}
      <rect width="32" height="32" rx="7.5" fill={`url(#${bgGradId})`} />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="7"
        stroke="#14B8A6"
        strokeOpacity="0.35"
        strokeWidth="1"
      />

      {/* Base "L" Spine & Bottom Rail */}
      <path
        d="M7.5 7.5C7.5 6.67 8.17 6 9 6H11C11.83 6 12.5 6.67 12.5 7.5V20.5H23C23.83 20.5 24.5 21.17 24.5 22C24.5 22.83 23.83 23.5 23 23.5H9C8.17 23.5 7.5 22.83 7.5 22V7.5Z"
        fill={`url(#${brandGradId})`}
      />

      {/* "B" Upper Wing / Loop */}
      <path
        d="M13 7.5C13 6.67 13.67 6 14.5 6H18.5C21.54 6 24 8.24 24 11C24 13.76 21.54 16 18.5 16H14.5C13.67 16 13 15.33 13 14.5V7.5Z"
        fill={`url(#${glowGradId})`}
      />
      {/* Upper loop counter/window */}
      <rect x="15.5" y="8.5" width="4.5" height="5" rx="2" fill="#0B2B27" />

      {/* "B" Lower Wing / Loop */}
      <path
        d="M13 14.75C13 13.92 13.67 13.25 14.5 13.25H19.5C22.4 13.25 24.75 15.4 24.75 18.1C24.75 20.15 23.45 21.88 21.6 22.65C20.85 22.95 20.08 22.35 20.15 21.55C20.18 21.2 20.2 20.9 20.2 20.6C20.2 18.6 18.6 17 16.6 17H14.5C13.67 17 13 16.33 13 15.5V14.75Z"
        fill={`url(#${brandGradId})`}
      />

      {/* Lead Discovery Focal Point (Beacon Dot) */}
      <circle cx="17.75" cy="11" r="1.3" fill="#A7F3D0" />
    </svg>
  );
}

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light' | 'auto';
  showText?: boolean;
  className?: string;
}

/**
 * Full LeadBro Logo Component with Icon + Wordmark
 */
export function Logo({
  size = 'sm',
  theme = 'auto',
  showText = true,
  className,
}: LogoProps) {
  const iconSizes = {
    sm: 22,
    md: 28,
    lg: 36,
  };

  const textSizes = {
    sm: 'text-[14.5px]',
    md: 'text-[17px]',
    lg: 'text-[22px]',
  };

  const textColor =
    theme === 'dark'
      ? 'text-[#F1F5F7]'
      : theme === 'light'
      ? 'text-ink'
      : 'text-ink dark:text-[#F1F5F7]';

  return (
    <div className={cx('inline-flex items-center gap-2.5', className)}>
      <LogoIcon size={iconSizes[size]} idSuffix={size} />
      {showText && (
        <span
          className={cx(
            'font-semibold tracking-[-0.3px] select-none flex items-center leading-none',
            textSizes[size],
            textColor
          )}
        >
          <span>Lead</span>
          <span className="text-brand font-bold">Bro</span>
        </span>
      )}
    </div>
  );
}

export default Logo;
