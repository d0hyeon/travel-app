import { useEffect, useEffectEvent, useRef } from 'react'
import { useVariation } from './useVariation'
import { useIsMobile } from './useIsMobile'

type Options = {
  sensitivity?: number
  duration?: number
  once?: boolean
  strict?: boolean
}

type SensitivityPreset = 'low' | 'medium' | 'high'

type PresetOptions = {
  sensitivity?: SensitivityPreset
  once?: boolean
  strict?: boolean
}

const PRESETS: Record<SensitivityPreset, { sensitivity: number; duration: number }> = {
  low: { sensitivity: 6, duration: 10000 },
  medium: { sensitivity: 4, duration: 8000 },
  high: { sensitivity: 2, duration: 5000 }
}

export function useActivationSignal(
  callback: () => void,
  options: Options | PresetOptions = { once: false, sensitivity: 'medium' }
) {
  const { once = false, strict = false } = options

  const { sensitivity, duration } =
    typeof options.sensitivity === 'string'
      ? PRESETS[options.sensitivity]
      : { ...PRESETS.medium, ...(options as Options) }

  const timestampsRef = useRef<number[]>([])
  const [getIsCalled, setIsCalled] = useVariation(false)

  const execute = useEffectEvent((cleanup: () => void) => {
    const isCalled = getIsCalled()
    if (once && isCalled) return

    const now = Date.now()
    const last = timestampsRef.current.at(-1)

    // noise filter
    if (last != null && now - last < 20) {
      return
    }

    timestampsRef.current.push(now)

    // duration window 유지
    while (
      timestampsRef.current.length &&
      now - timestampsRef.current[0] > duration
    ) {
      timestampsRef.current.shift()
    }

    if (timestampsRef.current.length >= sensitivity) {
      setIsCalled(true)
      callback()

      timestampsRef.current = []

      if (once) cleanup()
    }
  })

  const isMobile = useIsMobile()

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = isMobile
      ? ['pointerdown', 'keydown']
      : ['pointerdown', 'keydown', 'wheel']

    const handler = (event: Event) => {
      if (strict && !isActivatableNode(event.target)) {
        return
      }

      execute(cleanup)
    }

    const cleanup = () =>
      events.forEach((event) =>
        window.removeEventListener(event, handler, true)
      )

    events.forEach((event) =>
      window.addEventListener(event, handler, {
        passive: true,
        capture: true
      })
    )

    return cleanup
  }, [isMobile, strict])
}

function isElement(node: unknown): node is HTMLElement {
  return node instanceof HTMLElement
}

function isActivatableNode(node: unknown): boolean {
  if (!isElement(node)) {
    return false
  }

  if (isActivatableNode.TAG_NAMES.includes(node.tagName)) {
    return true
  }

  const role = node.getAttribute('role')
  if (role && isActivatableNode.ROLES.includes(role)) {
    return true
  }

  if (node.tabIndex >= 0) {
    return true
  }

  if (node.isContentEditable) {
    return true
  }

  const hasAttribute = isActivatableNode.ATTRIBUTES.some((attr) =>
    node.hasAttribute(attr)
  )

  if (hasAttribute) {
    return true
  }

  if (node.parentElement) {
    return isActivatableNode(node.parentElement)
  }

  return false
}

isActivatableNode.TAG_NAMES = [
  'INPUT',
  'BUTTON',
  'A',
  'SELECT',
  'TEXTAREA',
  'LABEL',
  'SUMMARY'
]

isActivatableNode.ROLES = [
  'button',
  'link',
  'checkbox',
  'radio',
  'switch',
  'menuitem',
  'tab',
  'option',
  'slider',
  'spinbutton',
  'textbox'
]

isActivatableNode.ATTRIBUTES = ['contenteditable', 'tabindex', 'onclick']