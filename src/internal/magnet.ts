// Magnetic: the right place pulls. Near a mark a dragged value is drawn onto it, strongly close in and
// not at all at the edge of its reach, so nothing jumps and you can still stop between marks.

/** The mark nearest to `value`, or null when there are none. */
export function nearestMark(value: number, marks: number[]): number | null {
  let best: number | null = null
  for (const m of marks) if (best === null || Math.abs(m - value) < Math.abs(best - value)) best = m
  return best
}

/** `raw` drawn toward the nearest mark within `reach`: sticky close to the mark, free at the edge. */
export function magnetTo(raw: number, marks: number[], reach: number): number {
  const mark = nearestMark(raw, marks)
  if (mark === null || reach <= 0) return raw
  const d = raw - mark
  if (Math.abs(d) >= reach) return raw
  const t = Math.abs(d) / reach
  return mark + Math.sign(d) * reach * t * t
}
