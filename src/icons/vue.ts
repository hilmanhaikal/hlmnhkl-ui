// Generated from icons.tsx by scripts/vue-icons.mjs. Do not edit: change icons.tsx and run the script.
import { h, type FunctionalComponent } from 'vue'
import styles from './icons.module.css'

export type IconProps = { size?: string; animated?: boolean }

// The same svg as the React Svg wrapper: 24 grid, 1.75 line, round ends, hidden from screen readers. With
// `animated` it plays its motion when its control is pointed at or focused (icons.module.css).
const icon = (motion: string, body: string): FunctionalComponent<IconProps> => {
  const Icon: FunctionalComponent<IconProps> = ({ size = '1em', animated }) =>
    h('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.75,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
      ...(animated ? { class: styles.icon, 'data-motion': motion } : {}),
      innerHTML: animated && motion === 'draw' ? body.replace(/<(\w+)/g, '<$1 pathLength="1"') : body,
    })
  Icon.props = ['size', 'animated']
  return Icon
}

export const CheckIcon = icon('draw', "<path d=\"M5 12.5l4.5 4.5L19 7.5\"/>")
export const XIcon = icon('pop', "<path d=\"M6 6l12 12M18 6L6 18\"/>")
export const ChevronDownIcon = icon('nudge-d', "<path d=\"M6 9l6 6 6-6\"/>")
export const ChevronRightIcon = icon('nudge-r', "<path d=\"M9 6l6 6-6 6\"/>")
export const ChevronLeftIcon = icon('nudge-l', "<path d=\"M15 6l-6 6 6 6\"/>")
export const CopyIcon = icon('pop', "<rect x=\"8.5\" y=\"8.5\" width=\"11\" height=\"11\" rx=\"2.5\"/><path d=\"M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2\"/>")
export const InfoIcon = icon('pop', "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v5M12 7.75v.01\"/>")
export const CheckCircleIcon = icon('draw', "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M8.5 12.25l2.5 2.5 4.5-5\"/>")
export const WarningIcon = icon('pop', "<path d=\"M12 4L2.75 19.5h18.5L12 4z\"/><path d=\"M12 10v4.5M12 17v.01\"/>")
export const ErrorIcon = icon('pop', "<path d=\"M8.25 3.5h7.5l5 5v7l-5 5h-7.5l-5-5v-7z\"/><path d=\"M9.5 9.5l5 5M14.5 9.5l-5 5\"/>")
export const SearchIcon = icon('wiggle', "<circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"M16 16l4 4\"/>")
export const PlusIcon = icon('pop', "<path d=\"M12 5v14M5 12h14\"/>")
export const MinusIcon = icon('pop', "<path d=\"M5 12h14\"/>")
export const MenuIcon = icon('draw', "<path d=\"M4 7h16M4 12h16M4 17h10\"/>")
export const MoreIcon = icon('wiggle', "<circle cx=\"6\" cy=\"12\" r=\"0.9\" fill=\"currentColor\"/><circle cx=\"12\" cy=\"12\" r=\"0.9\" fill=\"currentColor\"/><circle cx=\"18\" cy=\"12\" r=\"0.9\" fill=\"currentColor\"/>")
export const InboxIcon = icon('wiggle', "<path d=\"M3.5 13.5l2.5-8h12l2.5 8v5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z\"/><path d=\"M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5\"/>")
export const ArrowUpRightIcon = icon('nudge-ur', "<path d=\"M8 16L16 8M9 8h7v7\"/>")
export const TrashIcon = icon('wiggle', "<path d=\"M4.5 7h15M10 4h4M6.5 7l1 12.5h9l1-12.5\"/>")
export const EditIcon = icon('draw', "<path d=\"M4 20h4L19 9l-4-4L4 16v4z\"/>")
export const UndoIcon = icon('nudge-l', "<path d=\"M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11\"/>")
export const ShareIcon = icon('nudge-u', "<path d=\"M12 15V4M8 8l4-4 4 4\"/><path d=\"M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12\"/>")
export const HeartIcon = icon('pop', "<path d=\"M12 19.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z\"/>")
export const SettingsIcon = icon('turn', "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8\"/>")
export const PlayIcon = icon('pop', "<path d=\"M7.5 5.5v13l10.5-6.5z\" fill=\"currentColor\"/>")
export const PauseIcon = icon('pop', "<rect x=\"6.5\" y=\"5.5\" width=\"3.5\" height=\"13\" rx=\"1\" fill=\"currentColor\"/><rect x=\"14\" y=\"5.5\" width=\"3.5\" height=\"13\" rx=\"1\" fill=\"currentColor\"/>")
export const VolumeIcon = icon('wiggle', "<path d=\"M4 9.5h3.5L12 5.5v13l-4.5-4H4z\"/><path d=\"M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11\"/>")
export const VolumeOffIcon = icon('wiggle', "<path d=\"M4 9.5h3.5L12 5.5v13l-4.5-4H4z\"/><path d=\"M16 9.5l5 5M21 9.5l-5 5\"/>")
export const CaptionsIcon = icon('wiggle', "<rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\" rx=\"2.5\"/><path d=\"M10.5 10.25a2 2 0 1 0 0 3.5M17 10.25a2 2 0 1 0 0 3.5\"/>")
export const FullscreenIcon = icon('pop', "<path d=\"M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5\"/>")
export const ExitFullscreenIcon = icon('pop', "<path d=\"M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5\"/>")
export const PipIcon = icon('pop', "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><rect x=\"12\" y=\"11.5\" width=\"6\" height=\"4.5\" rx=\"1\" fill=\"currentColor\"/>")
export const BellIcon = icon('swing', "<path d=\"M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z\"/><path d=\"M10 20.5a2.2 2.2 0 0 0 4 0\"/>")
export const StopIcon = icon('pop', "<rect x=\"6.5\" y=\"6.5\" width=\"11\" height=\"11\" rx=\"2.5\" fill=\"currentColor\"/>")
export const ArrowUpIcon = icon('nudge-u', "<path d=\"M12 19V5M6 11l6-6 6 6\"/>")
export const ArrowDownIcon = icon('nudge-d', "<path d=\"M12 5v14M6 13l6 6 6-6\"/>")
export const DownloadIcon = icon('nudge-d', "<path d=\"M12 4v11M7.5 10.5L12 15l4.5-4.5\"/><path d=\"M5 19.5h14\"/>")
export const ReplyIcon = icon('nudge-l', "<path d=\"M10 6L4.5 11.5 10 17M5 11.5h8.5a6 6 0 0 1 6 6V19\"/>")
export const ClockIcon = icon('wiggle', "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7.5V12l3 2\"/>")
export const RetryIcon = icon('turn', "<path d=\"M19.5 12a7.5 7.5 0 1 1-2.2-5.3\"/><path d=\"M19.5 4.5v4h-4\"/>")
export const GripIcon = icon('wiggle', "<path d=\"M5 9h14M5 15h14\"/>")
export const FilterIcon = icon('draw', "<path d=\"M4.5 6h15l-5.75 7v5.5l-3.5-2V13z\"/>")
export const PaperclipIcon = icon('draw', "<path d=\"M19 11.5l-7.25 7.25a4.6 4.6 0 0 1-6.5-6.5L12.5 5a3 3 0 0 1 4.25 4.25l-7 7a1.5 1.5 0 0 1-2.1-2.1l6.6-6.65\"/>")
export const EyeIcon = icon('blink', "<path d=\"M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z\"/><circle cx=\"12\" cy=\"12\" r=\"2.75\"/>")
export const CodeIcon = icon('draw', "<path d=\"M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5\"/>")
export const SunIcon = icon('turn', "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4\"/>")
export const MoonIcon = icon('wiggle', "<path d=\"M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z\"/>")
export const BookIcon = icon('bounce', "<path d=\"M12 6.5C10.5 5.3 8.2 4.75 4 4.75v13.5c4.2 0 6.5.55 8 1.75 1.5-1.2 3.8-1.75 8-1.75V4.75c-4.2 0-6.5.55-8 1.75z\"/><path d=\"M12 6.5V20\"/>")
export const PlugIcon = icon('swing', "<path d=\"M9 3.5v4M15 3.5v4\"/><path d=\"M6.5 7.5h11v3a5.5 5.5 0 0 1-11 0z\"/><path d=\"M12 16v4.5\"/>")
export const CompassIcon = icon('turn', "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M15.5 8.5l-2 5-5 2 2-5z\"/>")
export const PaletteIcon = icon('bounce', "<path d=\"M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-.9 2-1.9 0-1.4-1.1-1.9-1.1-3.1 0-1 .8-1.75 1.8-1.75H17a3.5 3.5 0 0 0 3.5-3.5C20.5 6.9 16.7 3.5 12 3.5z\"/><circle cx=\"7.75\" cy=\"11.5\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"10.25\" cy=\"7.5\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"14.75\" cy=\"7.75\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/>")
export const RulerIcon = icon('draw', "<path d=\"M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z\"/><path d=\"m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2\"/>")
export const SlidersIcon = icon('bounce', "<path d=\"M4 7h9M17 7h3M4 17h3M11 17h9\"/><circle cx=\"15\" cy=\"7\" r=\"2\"/><circle cx=\"9\" cy=\"17\" r=\"2\"/>")
export const GridIcon = icon('pop', "<rect x=\"4\" y=\"4\" width=\"6.5\" height=\"6.5\" rx=\"1.5\"/><rect x=\"13.5\" y=\"4\" width=\"6.5\" height=\"6.5\" rx=\"1.5\"/><rect x=\"4\" y=\"13.5\" width=\"6.5\" height=\"6.5\" rx=\"1.5\"/><rect x=\"13.5\" y=\"13.5\" width=\"6.5\" height=\"6.5\" rx=\"1.5\"/>")
export const PackageIcon = icon('bounce', "<path d=\"M12 3.5l8 4.25v8.5L12 20.5l-8-4.25v-8.5z\"/><path d=\"M4 7.75l8 4.25 8-4.25M12 12v8.5\"/>")
export const SproutIcon = icon('grow', "<path d=\"M12 20.5V11\"/><path d=\"M12 14.5c-.4-3.6-2.8-5.7-6.5-5.7 0 3.6 2.5 5.7 6.5 5.7z\"/><path d=\"M12 11.5c.3-4 2.8-6.3 6.5-6.3 0 4-2.6 6.3-6.5 6.3z\"/><path d=\"M8.5 20.5h7\"/>")
export const LayersIcon = icon('bounce', "<path d=\"M12 4l8.5 4.5L12 13 3.5 8.5z\"/><path d=\"M3.5 12.75L12 17.25l8.5-4.5\"/><path d=\"M3.5 16.5L12 21l8.5-4.5\"/>")
export const TerminalIcon = icon('bounce', "<rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"15\" rx=\"2.5\"/><path d=\"M7.5 9.5l3 2.5-3 2.5M12.5 15h4\"/>")
export const FileIcon = icon('bounce', "<path d=\"M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z\"/><path d=\"M13.5 3.5V9H19\"/>")
export const FileTextIcon = icon('bounce', "<path d=\"M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z\"/><path d=\"M13.5 3.5V9H19M8.5 13h7M8.5 16.5h5\"/>")
export const FolderIcon = icon('bounce', "<path d=\"M3.5 7.5a2 2 0 0 1 2-2h4l2 2.25h7a2 2 0 0 1 2 2v7.75a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z\"/>")
export const ImageIcon = icon('pop', "<rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"15\" rx=\"2.5\"/><circle cx=\"9\" cy=\"9.5\" r=\"1.5\"/><path d=\"M20.5 15.5L16 11l-8.5 8.5\"/>")
export const LinkIcon = icon('draw', "<path d=\"M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1\"/><path d=\"M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1\"/>")
export const UploadIcon = icon('nudge-u', "<path d=\"M12 15V4M7.5 8.5L12 4l4.5 4.5\"/><path d=\"M5 19.5h14\"/>")
export const CloudIcon = icon('bounce', "<path d=\"M7 18.5a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17 9a4.75 4.75 0 0 1 .5 9.5z\"/>")
export const DatabaseIcon = icon('bounce', "<ellipse cx=\"12\" cy=\"6\" rx=\"7\" ry=\"2.5\"/><path d=\"M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6\"/><path d=\"M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5\"/>")
export const BarChartIcon = icon('draw', "<path d=\"M4 20h16\"/><path d=\"M7 16.5v-4M12 16.5V7M17 16.5v-7\"/>")
export const LineChartIcon = icon('draw', "<path d=\"M4 4v16h16\"/><path d=\"M7.5 15l3.5-4 3 2.5 5-6\"/>")
export const TableIcon = icon('bounce', "<rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"15\" rx=\"2.5\"/><path d=\"M3.5 9.5h17M3.5 14.5h17M10 9.5v10\"/>")
export const CalendarIcon = icon('wiggle', "<rect x=\"4\" y=\"5.5\" width=\"16\" height=\"14.5\" rx=\"2.5\"/><path d=\"M4 10h16M8.5 3.5v4M15.5 3.5v4\"/>")
export const ListIcon = icon('draw', "<path d=\"M9 7h11M9 12h11M9 17h11\"/><path d=\"M4.5 7h.01M4.5 12h.01M4.5 17h.01\"/>")
export const HashIcon = icon('draw', "<path d=\"M5 9h15M4 15h15M10 4L8 20M16 4l-2 16\"/>")
export const UserIcon = icon('bounce', "<circle cx=\"12\" cy=\"8.5\" r=\"4\"/><path d=\"M4.5 20a7.5 7.5 0 0 1 15 0\"/>")
export const UsersIcon = icon('bounce', "<circle cx=\"9\" cy=\"9\" r=\"3.5\"/><path d=\"M3 19.5a6 6 0 0 1 12 0\"/><path d=\"M15.5 5.75a3.5 3.5 0 0 1 0 6.5M17.5 14.25A6 6 0 0 1 21 19.5\"/>")
export const MailIcon = icon('wiggle', "<rect x=\"3.5\" y=\"5.5\" width=\"17\" height=\"13\" rx=\"2.5\"/><path d=\"M4 7.5l8 5.5 8-5.5\"/>")
export const MessageIcon = icon('wiggle', "<path d=\"M20.5 14.5a2 2 0 0 1-2 2H9.5L5 20v-3.5h.5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z\"/>")
export const PhoneIcon = icon('wiggle', "<rect x=\"6.5\" y=\"3\" width=\"11\" height=\"18\" rx=\"2.5\"/><path d=\"M11 17.5h2\"/>")
export const AtSignIcon = icon('bounce', "<circle cx=\"12\" cy=\"12\" r=\"3.5\"/><path d=\"M15.5 8.5v4.75a2.25 2.25 0 0 0 4.5 0V12a8 8 0 1 0-3.2 6.4\"/>")
export const LockIcon = icon('wiggle', "<rect x=\"5\" y=\"10.5\" width=\"14\" height=\"10\" rx=\"2.5\"/><path d=\"M8 10.5V8a4 4 0 0 1 8 0v2.5\"/>")
export const UnlockIcon = icon('wiggle', "<rect x=\"5\" y=\"10.5\" width=\"14\" height=\"10\" rx=\"2.5\"/><path d=\"M8 10.5V8a4 4 0 0 1 7.75-1.4\"/>")
export const KeyIcon = icon('swing', "<circle cx=\"8\" cy=\"15.5\" r=\"4\"/><path d=\"M10.9 12.6L19.5 4M16.5 7L19 9.5M14 9.5l2 2\"/>")
export const ShieldIcon = icon('bounce', "<path d=\"M12 3.5l7 2.75v5.25c0 4.25-2.9 7.6-7 9-4.1-1.4-7-4.75-7-9V6.25z\"/>")
export const LogInIcon = icon('nudge-r', "<path d=\"M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4\"/><path d=\"M3.5 12h11M10.5 8l4 4-4 4\"/>")
export const LogOutIcon = icon('nudge-r', "<path d=\"M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4\"/><path d=\"M9.5 12h11M16.5 8l4 4-4 4\"/>")
export const SendIcon = icon('nudge-ur', "<path d=\"M20.5 3.5l-17 7 7 3 3 7z\"/><path d=\"M20.5 3.5l-10 10\"/>")
export const SmileIcon = icon('blink', "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M8.5 14.5a4.5 4.5 0 0 0 7 0\"/><path d=\"M9 9.5h.01M15 9.5h.01\"/>")
export const VideoIcon = icon('wiggle', "<rect x=\"3\" y=\"6.5\" width=\"12.5\" height=\"11\" rx=\"2.5\"/><path d=\"M15.5 10.5l5.5-3v9l-5.5-3\"/>")
export const MicIcon = icon('wiggle', "<rect x=\"9\" y=\"3.5\" width=\"6\" height=\"11\" rx=\"3\"/><path d=\"M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5\"/>")
export const CartIcon = icon('wiggle', "<path d=\"M3 4.5h2.5l2 10.5h10.5l2-7.5H6.5\"/><circle cx=\"9\" cy=\"19\" r=\"1.25\"/><circle cx=\"17\" cy=\"19\" r=\"1.25\"/>")
export const BagIcon = icon('wiggle', "<path d=\"M5.5 8h13l-1 12h-11z\"/><path d=\"M9 10.5V7a3 3 0 0 1 6 0v3.5\"/>")
export const CreditCardIcon = icon('bounce', "<rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\" rx=\"2.5\"/><path d=\"M3 10h18M7 14.5h3\"/>")
export const ReceiptIcon = icon('bounce', "<path d=\"M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z\"/><path d=\"M9 8.5h6M9 12h6M9 15.5h3\"/>")
export const TagIcon = icon('swing', "<path d=\"M3.5 12.1V5A1.5 1.5 0 0 1 5 3.5h7.1a1.5 1.5 0 0 1 1.06.44l7.4 7.4a1.5 1.5 0 0 1 0 2.12l-7.1 7.1a1.5 1.5 0 0 1-2.12 0l-7.4-7.4a1.5 1.5 0 0 1-.44-1.06z\"/><circle cx=\"8.25\" cy=\"8.25\" r=\"1.25\"/>")
export const GiftIcon = icon('pop', "<rect x=\"4\" y=\"8.5\" width=\"16\" height=\"4\" rx=\"1\"/><path d=\"M5.5 12.5V20h13v-7.5M12 8.5V20\"/><path d=\"M12 8.5C10.5 5 7 4.75 7 6.75 7 8 9 8.5 12 8.5zM12 8.5c1.5-3.5 5-3.75 5-1.75 0 1.25-2 1.75-5 1.75z\"/>")
export const HomeIcon = icon('bounce', "<path d=\"M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z\"/>")
export const MapPinIcon = icon('bounce', "<path d=\"M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/>")
export const GlobeIcon = icon('turn', "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M3.5 12h17\"/><path d=\"M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5S9.6 5.9 12 3.5z\"/>")
export const StarIcon = icon('pop', "<path d=\"M12.00 3.85L14.20 9.57L20.32 9.90L15.57 13.76L17.14 19.68L12.00 16.35L6.86 19.68L8.43 13.76L3.68 9.90L9.80 9.57z\"/>")
export const BookmarkIcon = icon('swing', "<path d=\"M6.5 4.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16L12 16.5l-5.5 4z\"/>")
export const FlagIcon = icon('swing', "<path d=\"M5 21V4\"/><path d=\"M5 4.5c3-1.5 5.5 1.5 8.5 0s5.5 0 5.5 0v9s-2.5-1.5-5.5 0-5.5-1.5-8.5 0\"/>")
export const TruckIcon = icon('nudge-r', "<path d=\"M14 16.5v-10H3.5v10h1.75M14 9.5h3.75l3 3.5v3.5h-1.5M8.75 16.5h6.5\"/><circle cx=\"7\" cy=\"17\" r=\"1.75\"/><circle cx=\"17.75\" cy=\"17\" r=\"1.75\"/>")
export const ChevronUpIcon = icon('nudge-u', "<path d=\"M6 15l6-6 6 6\"/>")
export const ArrowLeftIcon = icon('nudge-l', "<path d=\"M19 12H5M11 6l-6 6 6 6\"/>")
export const ArrowRightIcon = icon('nudge-r', "<path d=\"M5 12h14M13 6l6 6-6 6\"/>")
export const EyeOffIcon = icon('blink', "<path d=\"M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z\"/><circle cx=\"12\" cy=\"12\" r=\"2.75\"/><path d=\"M4 4l16 16\"/>")
export const ZapIcon = icon('pop', "<path d=\"M13 3L5 13.5h6L10.5 21 19 10.5h-6z\"/>")
export const LayoutIcon = icon('bounce', "<rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"15\" rx=\"2.5\"/><path d=\"M3.5 9.5h17M9.5 9.5v10\"/>")
