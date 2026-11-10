import { Children, cloneElement, isValidElement, type ReactElement, type SVGProps } from 'react'
import styles from './icons.module.css'

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string
  /** Plays the icon's own small motion when the button or link it sits in is pointed at or focused. Off by default; never with reduced motion. */
  animated?: boolean
}

type Motion = 'draw' | 'nudge-r' | 'nudge-l' | 'nudge-u' | 'nudge-d' | 'nudge-ur' | 'swing' | 'turn' | 'pop' | 'blink' | 'wiggle' | 'bounce' | 'grow'

// Every icon names the motion that fits its meaning; `animated` decides whether it plays. A drawn line
// needs its length as 1 to be drawn in from its start, so those shapes get pathLength.
function Svg({ size = '1em', m, animated, className, children, ...rest }: IconProps & { m: Motion }) {
  const shapes = animated && m === 'draw' ? Children.map(children, (c) => (isValidElement(c) ? cloneElement(c as ReactElement<{ pathLength?: number }>, { pathLength: 1 }) : c)) : children
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
      className={animated ? (className ? `${styles.icon} ${className}` : styles.icon) : className}
      data-motion={animated ? m : undefined}
      {...rest}
    >
      {shapes}
    </svg>
  )
}

export const CheckIcon = (p: IconProps) => <Svg m="draw" {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
export const XIcon = (p: IconProps) => <Svg m="pop" {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const ChevronDownIcon = (p: IconProps) => <Svg m="nudge-d" {...p}><path d="M6 9l6 6 6-6" /></Svg>
export const ChevronRightIcon = (p: IconProps) => <Svg m="nudge-r" {...p}><path d="M9 6l6 6-6 6" /></Svg>
export const ChevronLeftIcon = (p: IconProps) => <Svg m="nudge-l" {...p}><path d="M15 6l-6 6 6 6" /></Svg>
export const CopyIcon = (p: IconProps) => (
  <Svg m="pop" {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
  </Svg>
)
export const InfoIcon = (p: IconProps) => (
  <Svg m="pop" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.75v.01" />
  </Svg>
)
export const CheckCircleIcon = (p: IconProps) => (
  <Svg m="draw" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.25l2.5 2.5 4.5-5" />
  </Svg>
)
export const WarningIcon = (p: IconProps) => (
  <Svg m="pop" {...p}>
    <path d="M12 4L2.75 19.5h18.5L12 4z" />
    <path d="M12 10v4.5M12 17v.01" />
  </Svg>
)
export const ErrorIcon = (p: IconProps) => (
  <Svg m="pop" {...p}>
    <path d="M8.25 3.5h7.5l5 5v7l-5 5h-7.5l-5-5v-7z" />
    <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
  </Svg>
)
export const EyeIcon = (p: IconProps) => (
  <Svg m="blink" {...p}>
    <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.75" />
  </Svg>
)
export const CodeIcon = (p: IconProps) => <Svg m="draw" {...p}><path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5" /></Svg>
export const SearchIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </Svg>
)
export const SunIcon = (p: IconProps) => (
  <Svg m="turn" {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
  </Svg>
)
export const MoonIcon = (p: IconProps) => <Svg m="wiggle" {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></Svg>
export const PlusIcon = (p: IconProps) => <Svg m="pop" {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const MinusIcon = (p: IconProps) => <Svg m="pop" {...p}><path d="M5 12h14" /></Svg>
export const MenuIcon = (p: IconProps) => <Svg m="draw" {...p}><path d="M4 7h16M4 12h16M4 17h10" /></Svg>
export const MoreIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <circle cx="6" cy="12" r="0.9" fill="currentColor" />
    <circle cx="12" cy="12" r="0.9" fill="currentColor" />
    <circle cx="18" cy="12" r="0.9" fill="currentColor" />
  </Svg>
)
export const InboxIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <path d="M3.5 13.5l2.5-8h12l2.5 8v5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
    <path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5" />
  </Svg>
)
export const ArrowUpRightIcon = (p: IconProps) => <Svg m="nudge-ur" {...p}><path d="M8 16L16 8M9 8h7v7" /></Svg>
export const TrashIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <path d="M4.5 7h15M10 4h4M6.5 7l1 12.5h9l1-12.5" />
  </Svg>
)
export const EditIcon = (p: IconProps) => <Svg m="draw" {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /></Svg>
export const UndoIcon = (p: IconProps) => <Svg m="nudge-l" {...p}><path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Svg>
export const ShareIcon = (p: IconProps) => (
  <Svg m="nudge-u" {...p}>
    <path d="M12 15V4M8 8l4-4 4 4" />
    <path d="M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12" />
  </Svg>
)
export const HeartIcon = (p: IconProps) => (
  <Svg m="pop" {...p}><path d="M12 19.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z" /></Svg>
)
export const SettingsIcon = (p: IconProps) => (
  <Svg m="turn" {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
  </Svg>
)
export const PlayIcon = (p: IconProps) => <Svg m="pop" {...p}><path d="M7.5 5.5v13l10.5-6.5z" fill="currentColor" /></Svg>
export const PauseIcon = (p: IconProps) => (
  <Svg m="pop" {...p}>
    <rect x="6.5" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" />
    <rect x="14" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" />
  </Svg>
)
export const VolumeIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Svg>
)
export const VolumeOffIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </Svg>
)
export const CaptionsIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M10.5 10.25a2 2 0 1 0 0 3.5M17 10.25a2 2 0 1 0 0 3.5" />
  </Svg>
)
export const FullscreenIcon = (p: IconProps) => <Svg m="pop" {...p}><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></Svg>
export const ExitFullscreenIcon = (p: IconProps) => <Svg m="pop" {...p}><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" /></Svg>
export const PipIcon = (p: IconProps) => (
  <Svg m="pop" {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <rect x="12" y="11.5" width="6" height="4.5" rx="1" fill="currentColor" />
  </Svg>
)
export const BellIcon = (p: IconProps) => (
  <Svg m="swing" {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Svg>
)
export const ArrowUpIcon = (p: IconProps) => <Svg m="nudge-u" {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>
export const ArrowDownIcon = (p: IconProps) => <Svg m="nudge-d" {...p}><path d="M12 5v14M6 13l6 6 6-6" /></Svg>
export const DownloadIcon = (p: IconProps) => (
  <Svg m="nudge-d" {...p}>
    <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" />
    <path d="M5 19.5h14" />
  </Svg>
)
export const ReplyIcon = (p: IconProps) => <Svg m="nudge-l" {...p}><path d="M10 6L4.5 11.5 10 17M5 11.5h8.5a6 6 0 0 1 6 6V19" /></Svg>
export const ClockIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
)
export const RetryIcon = (p: IconProps) => (
  <Svg m="turn" {...p}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.5 4.5v4h-4" />
  </Svg>
)
export const GripIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <path d="M5 9h14M5 15h14" />
  </Svg>
)
export const FilterIcon = (p: IconProps) => <Svg m="draw" {...p}><path d="M4.5 6h15l-5.75 7v5.5l-3.5-2V13z" /></Svg>

export const BookIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <path d="M12 6.5C10.5 5.3 8.2 4.75 4 4.75v13.5c4.2 0 6.5.55 8 1.75 1.5-1.2 3.8-1.75 8-1.75V4.75c-4.2 0-6.5.55-8 1.75z" />
    <path d="M12 6.5V20" />
  </Svg>
)
export const PlugIcon = (p: IconProps) => (
  <Svg m="swing" {...p}>
    <path d="M9 3.5v4M15 3.5v4" />
    <path d="M6.5 7.5h11v3a5.5 5.5 0 0 1-11 0z" />
    <path d="M12 16v4.5" />
  </Svg>
)
export const CompassIcon = (p: IconProps) => (
  <Svg m="turn" {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </Svg>
)
export const PaletteIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-.9 2-1.9 0-1.4-1.1-1.9-1.1-3.1 0-1 .8-1.75 1.8-1.75H17a3.5 3.5 0 0 0 3.5-3.5C20.5 6.9 16.7 3.5 12 3.5z" />
    <circle cx="7.75" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="10.25" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="14.75" cy="7.75" r="1.1" fill="currentColor" stroke="none" />
  </Svg>
)
export const SlidersIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Svg>
)
export const GridIcon = (p: IconProps) => (
  <Svg m="pop" {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </Svg>
)
export const PackageIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <path d="M12 3.5l8 4.25v8.5L12 20.5l-8-4.25v-8.5z" />
    <path d="M4 7.75l8 4.25 8-4.25M12 12v8.5" />
  </Svg>
)
export const SproutIcon = (p: IconProps) => (
  <Svg m="grow" {...p}>
    <path d="M12 20.5V11" />
    <path d="M12 14.5c-.4-3.6-2.8-5.7-6.5-5.7 0 3.6 2.5 5.7 6.5 5.7z" />
    <path d="M12 11.5c.3-4 2.8-6.3 6.5-6.3 0 4-2.6 6.3-6.5 6.3z" />
    <path d="M8.5 20.5h7" />
  </Svg>
)
export const LayersIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <path d="M12 4l8.5 4.5L12 13 3.5 8.5z" />
    <path d="M3.5 12.75L12 17.25l8.5-4.5" />
    <path d="M3.5 16.5L12 21l8.5-4.5" />
  </Svg>
)
export const TerminalIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <path d="M7.5 9.5l3 2.5-3 2.5M12.5 15h4" />
  </Svg>
)
export const FileIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
    <path d="M13.5 3.5V9H19" />
  </Svg>
)
export const FileTextIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
    <path d="M13.5 3.5V9H19M8.5 13h7M8.5 16.5h5" />
  </Svg>
)
export const FolderIcon = (p: IconProps) => <Svg m="bounce" {...p}><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.25h7a2 2 0 0 1 2 2v7.75a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></Svg>
export const ImageIcon = (p: IconProps) => (
  <Svg m="pop" {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="9.5" r="1.5" />
    <path d="M20.5 15.5L16 11l-8.5 8.5" />
  </Svg>
)
export const LinkIcon = (p: IconProps) => (
  <Svg m="draw" {...p}>
    <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
  </Svg>
)
export const PaperclipIcon = (p: IconProps) => <Svg m="draw" {...p}><path d="M19 11.5l-7.25 7.25a4.6 4.6 0 0 1-6.5-6.5L12.5 5a3 3 0 0 1 4.25 4.25l-7 7a1.5 1.5 0 0 1-2.1-2.1l6.6-6.65" /></Svg>
export const UploadIcon = (p: IconProps) => (
  <Svg m="nudge-u" {...p}>
    <path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" />
    <path d="M5 19.5h14" />
  </Svg>
)
export const CloudIcon = (p: IconProps) => <Svg m="bounce" {...p}><path d="M7 18.5a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17 9a4.75 4.75 0 0 1 .5 9.5z" /></Svg>
export const DatabaseIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <ellipse cx="12" cy="6" rx="7" ry="2.5" />
    <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
    <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
  </Svg>
)
export const BarChartIcon = (p: IconProps) => (
  <Svg m="draw" {...p}>
    <path d="M4 20h16" />
    <path d="M7 16.5v-4M12 16.5V7M17 16.5v-7" />
  </Svg>
)
export const LineChartIcon = (p: IconProps) => (
  <Svg m="draw" {...p}>
    <path d="M4 4v16h16" />
    <path d="M7.5 15l3.5-4 3 2.5 5-6" />
  </Svg>
)
export const TableIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10" />
  </Svg>
)
export const CalendarIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </Svg>
)
export const ListIcon = (p: IconProps) => (
  <Svg m="draw" {...p}>
    <path d="M9 7h11M9 12h11M9 17h11" />
    <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
  </Svg>
)
export const HashIcon = (p: IconProps) => <Svg m="draw" {...p}><path d="M5 9h15M4 15h15M10 4L8 20M16 4l-2 16" /></Svg>
export const UserIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <circle cx="12" cy="8.5" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Svg>
)
export const UsersIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <circle cx="9" cy="9" r="3.5" />
    <path d="M3 19.5a6 6 0 0 1 12 0" />
    <path d="M15.5 5.75a3.5 3.5 0 0 1 0 6.5M17.5 14.25A6 6 0 0 1 21 19.5" />
  </Svg>
)
export const MailIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="M4 7.5l8 5.5 8-5.5" />
  </Svg>
)
export const MessageIcon = (p: IconProps) => <Svg m="wiggle" {...p}><path d="M20.5 14.5a2 2 0 0 1-2 2H9.5L5 20v-3.5h.5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" /></Svg>
export const PhoneIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <rect x="6.5" y="3" width="11" height="18" rx="2.5" />
    <path d="M11 17.5h2" />
  </Svg>
)
export const AtSignIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M15.5 8.5v4.75a2.25 2.25 0 0 0 4.5 0V12a8 8 0 1 0-3.2 6.4" />
  </Svg>
)
export const LockIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
)
export const UnlockIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 7.75-1.4" />
  </Svg>
)
export const KeyIcon = (p: IconProps) => (
  <Svg m="swing" {...p}>
    <circle cx="8" cy="15.5" r="4" />
    <path d="M10.9 12.6L19.5 4M16.5 7L19 9.5M14 9.5l2 2" />
  </Svg>
)
export const ShieldIcon = (p: IconProps) => <Svg m="bounce" {...p}><path d="M12 3.5l7 2.75v5.25c0 4.25-2.9 7.6-7 9-4.1-1.4-7-4.75-7-9V6.25z" /></Svg>
export const LogInIcon = (p: IconProps) => (
  <Svg m="nudge-r" {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    <path d="M3.5 12h11M10.5 8l4 4-4 4" />
  </Svg>
)
export const LogOutIcon = (p: IconProps) => (
  <Svg m="nudge-r" {...p}>
    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
    <path d="M9.5 12h11M16.5 8l4 4-4 4" />
  </Svg>
)
export const SendIcon = (p: IconProps) => (
  <Svg m="nudge-ur" {...p}>
    <path d="M20.5 3.5l-17 7 7 3 3 7z" />
    <path d="M20.5 3.5l-10 10" />
  </Svg>
)
export const SmileIcon = (p: IconProps) => (
  <Svg m="blink" {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
    <path d="M9 9.5h.01M15 9.5h.01" />
  </Svg>
)
export const VideoIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <rect x="3" y="6.5" width="12.5" height="11" rx="2.5" />
    <path d="M15.5 10.5l5.5-3v9l-5.5-3" />
  </Svg>
)
export const MicIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <rect x="9" y="3.5" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
  </Svg>
)
export const CartIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <path d="M3 4.5h2.5l2 10.5h10.5l2-7.5H6.5" />
    <circle cx="9" cy="19" r="1.25" />
    <circle cx="17" cy="19" r="1.25" />
  </Svg>
)
export const BagIcon = (p: IconProps) => (
  <Svg m="wiggle" {...p}>
    <path d="M5.5 8h13l-1 12h-11z" />
    <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
  </Svg>
)
export const CreditCardIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3 10h18M7 14.5h3" />
  </Svg>
)
export const ReceiptIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <path d="M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z" />
    <path d="M9 8.5h6M9 12h6M9 15.5h3" />
  </Svg>
)
export const TagIcon = (p: IconProps) => (
  <Svg m="swing" {...p}>
    <path d="M3.5 12.1V5A1.5 1.5 0 0 1 5 3.5h7.1a1.5 1.5 0 0 1 1.06.44l7.4 7.4a1.5 1.5 0 0 1 0 2.12l-7.1 7.1a1.5 1.5 0 0 1-2.12 0l-7.4-7.4a1.5 1.5 0 0 1-.44-1.06z" />
    <circle cx="8.25" cy="8.25" r="1.25" />
  </Svg>
)
export const GiftIcon = (p: IconProps) => (
  <Svg m="pop" {...p}>
    <rect x="4" y="8.5" width="16" height="4" rx="1" />
    <path d="M5.5 12.5V20h13v-7.5M12 8.5V20" />
    <path d="M12 8.5C10.5 5 7 4.75 7 6.75 7 8 9 8.5 12 8.5zM12 8.5c1.5-3.5 5-3.75 5-1.75 0 1.25-2 1.75-5 1.75z" />
  </Svg>
)
export const HomeIcon = (p: IconProps) => <Svg m="bounce" {...p}><path d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z" /></Svg>
export const MapPinIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
)
export const GlobeIcon = (p: IconProps) => (
  <Svg m="turn" {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5S9.6 5.9 12 3.5z" />
  </Svg>
)
export const StarIcon = (p: IconProps) => <Svg m="pop" {...p}><path d="M12.00 3.85L14.20 9.57L20.32 9.90L15.57 13.76L17.14 19.68L12.00 16.35L6.86 19.68L8.43 13.76L3.68 9.90L9.80 9.57z" /></Svg>
export const BookmarkIcon = (p: IconProps) => <Svg m="swing" {...p}><path d="M6.5 4.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16L12 16.5l-5.5 4z" /></Svg>
export const FlagIcon = (p: IconProps) => (
  <Svg m="swing" {...p}>
    <path d="M5 21V4" />
    <path d="M5 4.5c3-1.5 5.5 1.5 8.5 0s5.5 0 5.5 0v9s-2.5-1.5-5.5 0-5.5-1.5-8.5 0" />
  </Svg>
)
export const TruckIcon = (p: IconProps) => (
  <Svg m="nudge-r" {...p}>
    <path d="M14 16.5v-10H3.5v10h1.75M14 9.5h3.75l3 3.5v3.5h-1.5M8.75 16.5h6.5" />
    <circle cx="7" cy="17" r="1.75" />
    <circle cx="17.75" cy="17" r="1.75" />
  </Svg>
)
export const ChevronUpIcon = (p: IconProps) => <Svg m="nudge-u" {...p}><path d="M6 15l6-6 6 6" /></Svg>
export const ArrowLeftIcon = (p: IconProps) => <Svg m="nudge-l" {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>
export const ArrowRightIcon = (p: IconProps) => <Svg m="nudge-r" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
export const EyeOffIcon = (p: IconProps) => (
  <Svg m="blink" {...p}>
    <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.75" />
    <path d="M4 4l16 16" />
  </Svg>
)
export const ZapIcon = (p: IconProps) => <Svg m="pop" {...p}><path d="M13 3L5 13.5h6L10.5 21 19 10.5h-6z" /></Svg>
export const LayoutIcon = (p: IconProps) => (
  <Svg m="bounce" {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9.5h17M9.5 9.5v10" />
  </Svg>
)
