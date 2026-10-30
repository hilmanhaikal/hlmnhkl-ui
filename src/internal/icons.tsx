import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string }

function Svg({ size = '1em', children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const CheckIcon = (p: IconProps) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
export const XIcon = (p: IconProps) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const ChevronDownIcon = (p: IconProps) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>
export const ChevronRightIcon = (p: IconProps) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>
export const ChevronLeftIcon = (p: IconProps) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>
export const CopyIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
  </Svg>
)
export const InfoIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.75v.01" />
  </Svg>
)
export const CheckCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.25l2.5 2.5 4.5-5" />
  </Svg>
)
export const WarningIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4L2.75 19.5h18.5L12 4z" />
    <path d="M12 10v4.5M12 17v.01" />
  </Svg>
)
export const ErrorIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.25 3.5h7.5l5 5v7l-5 5h-7.5l-5-5v-7z" />
    <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
  </Svg>
)
export const EyeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.75" />
  </Svg>
)
export const CodeIcon = (p: IconProps) => <Svg {...p}><path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5" /></Svg>
export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </Svg>
)
export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
  </Svg>
)
export const MoonIcon = (p: IconProps) => <Svg {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></Svg>
export const PlusIcon = (p: IconProps) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const MinusIcon = (p: IconProps) => <Svg {...p}><path d="M5 12h14" /></Svg>
export const MenuIcon = (p: IconProps) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /></Svg>
export const MoreIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="12" r="0.9" fill="currentColor" />
    <circle cx="12" cy="12" r="0.9" fill="currentColor" />
    <circle cx="18" cy="12" r="0.9" fill="currentColor" />
  </Svg>
)
export const InboxIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 13.5l2.5-8h12l2.5 8v5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
    <path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5" />
  </Svg>
)
export const ArrowUpRightIcon = (p: IconProps) => <Svg {...p}><path d="M8 16L16 8M9 8h7v7" /></Svg>
export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 7h15M10 4h4M6.5 7l1 12.5h9l1-12.5" />
  </Svg>
)
export const EditIcon = (p: IconProps) => <Svg {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /></Svg>
export const UndoIcon = (p: IconProps) => <Svg {...p}><path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Svg>
export const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15V4M8 8l4-4 4 4" />
    <path d="M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12" />
  </Svg>
)
export const HeartIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 19.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z" /></Svg>
)
export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
  </Svg>
)
export const PlayIcon = (p: IconProps) => <Svg {...p}><path d="M7.5 5.5v13l10.5-6.5z" fill="currentColor" /></Svg>
export const PauseIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6.5" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" />
    <rect x="14" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" />
  </Svg>
)
export const VolumeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Svg>
)
export const VolumeOffIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </Svg>
)
export const CaptionsIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M10.5 10.25a2 2 0 1 0 0 3.5M17 10.25a2 2 0 1 0 0 3.5" />
  </Svg>
)
export const FullscreenIcon = (p: IconProps) => <Svg {...p}><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></Svg>
export const ExitFullscreenIcon = (p: IconProps) => <Svg {...p}><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" /></Svg>
export const PipIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <rect x="12" y="11.5" width="6" height="4.5" rx="1" fill="currentColor" />
  </Svg>
)
export const BellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Svg>
)
export const ArrowUpIcon = (p: IconProps) => <Svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>
export const ArrowDownIcon = (p: IconProps) => <Svg {...p}><path d="M12 5v14M6 13l6 6 6-6" /></Svg>
export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" />
    <path d="M5 19.5h14" />
  </Svg>
)
export const ReplyIcon = (p: IconProps) => <Svg {...p}><path d="M10 6L4.5 11.5 10 17M5 11.5h8.5a6 6 0 0 1 6 6V19" /></Svg>
export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
)
export const RetryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.5 4.5v4h-4" />
  </Svg>
)
export const GripIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 9h14M5 15h14" />
  </Svg>
)
export const FilterIcon = (p: IconProps) => <Svg {...p}><path d="M4.5 6h15l-5.75 7v5.5l-3.5-2V13z" /></Svg>
