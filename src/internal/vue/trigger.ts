import { Comment, Fragment, cloneVNode, type Ref, type VNode } from 'vue'

/** The first real node in a slot, looking through fragments and past comments. */
export function firstNode(nodes?: VNode[]): VNode | undefined {
  for (const n of nodes ?? []) {
    if (n.type === Comment) continue
    const inner = n.type === Fragment ? firstNode(n.children as VNode[]) : n
    if (inner) return inner
  }
}

/** A ref callback that stores the element. A component's ref is its instance, so its element is its $el. */
export const elementRef = (target: Ref<HTMLElement | null>) => (el: unknown) => (target.value = el instanceof Element ? (el as HTMLElement) : ((el as { $el?: HTMLElement } | null)?.$el ?? null))

/** The slot's own element as the trigger, given the part's ref, ARIA and events, like React's cloneElement. */
export function cloneTrigger(node: VNode | undefined, ref: (el: unknown) => void, props: Record<string, unknown>) {
  return node ? cloneVNode(node, { ref, ...props }, true) : null
}
