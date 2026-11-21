// gooee-motion: the motion of Gooee UI's parts, with no framework. Timing comes from the --gooee-*
// tokens (gooee-tokens), so load those too; reduced motion sets them to 0 and every move jumps.
// Each create* function takes its element (or a function that returns it) and one options object. It
// returns plain methods, and destroy() cleans up.

// Panels that grow out of what opened them, and highlights that stretch to a new choice.
export { createMorph, createDialogMorph, createStretch, type MorphOrigin, type MorphOptions, type StretchBox, type StretchOptions } from './liquid'
// A highlight that flows to a new choice on a neck that thins and breaks.
export { createFlow, type FlowOptions, type Place } from './liquidMatter'
// A field's focus edge that flows round from the press, and a menu's hover bead.
export { createEdgeFlow, createBead, type EdgeFlowOptions, type BeadOptions } from './liquidMore'
// A button whose edge dents under the finger.
export { createSoftPress, type SoftLook, type SoftPressOptions } from './softPress'
// Panels the hand drags and lets go of, and a sheet dragged down to close.
export { createFling, createDragClose, type Fling, type FlingOptions, type DragCloseOptions, type Target } from './fling'
// A value turned by drag, keys and wheel that coasts and lands on a mark.
export { createScrubber, type ScrubberOptions } from './scrubber'
// One frame loop for everything that follows the page's scroll.
export { createScrollFrame, bandProgress, easeToward, type ScrollFrame, type ScrollReader } from './scrollFrame'
// The motion maths underneath: the morph curve, glides and follows.
export { bezier, morphTo, glide, follow, rubber, speedTracker, type Curve, type MorphToOptions, type GlideOptions } from '../feel'
export { motionMs, easing, morphCurve, prefersReducedMotion, type MotionToken } from '../motion'
