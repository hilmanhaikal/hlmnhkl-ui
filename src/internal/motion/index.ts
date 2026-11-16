// gooee-motion: the motion of Gooee UI's parts, with no framework. Timing comes from the --gooee-*
// tokens (gooee-tokens), so load those too; reduced motion sets them to 0 and every move jumps.

// Panels that grow out of what opened them, and highlights that stretch to a new choice.
export { createLiquid, createDialogMorph, createStretch, stretch, startShape, type LiquidOrigin, type StretchBox } from './liquid'
// A highlight that flows to a new choice on a neck that thins and breaks.
export { createFlow, type FlowOptions, type Place } from './liquidMatter'
// A field's focus edge that flows round from the press, and a menu's hover bead.
export { edgeFlow, bead } from './liquidMore'
// A button whose edge dents under the finger.
export { createSoftPress, type SoftLook, type SoftPressOptions } from './softPress'
// Panels the hand drags and lets go of, and a sheet dragged down to close.
export { createFling, createDragClose, release, type Fling, type DragCloseOptions, type Target } from './fling'
// A value turned by drag, keys and wheel that coasts and lands on a mark.
export { createScrubber, type ScrubberOptions } from './scrubber'
// One frame loop for everything that follows the page's scroll.
export { onScrollFrame, bandProgress, easeToward, type ScrollFrame, type ScrollReader } from './scrollFrame'
// The motion maths underneath: the morph curve, glides and follows.
export { MORPH, bezier, morphTo, glide, follow, rubber, speedTracker, type Curve, type MorphOptions, type GlideOptions } from '../feel'
export { motionMs, readMotionMs, easing, morphCurve, prefersReducedMotion, type MotionToken } from '../motion'
