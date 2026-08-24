import { useEffect, useRef, type ReactNode } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  titleId: string
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({
  isOpen,
  titleId,
  onClose,
  children,
}: BottomSheetProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const dialog = dialogRef.current
      if (!dialog) {
        return
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'),
      ).filter((element) => element.tabIndex >= 0)
      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)

      if (!firstElement || !lastElement) {
        return
      }

      if (!dialog.contains(document.activeElement)) {
        event.preventDefault()
        const elementToFocus = event.shiftKey ? lastElement : firstElement
        elementToFocus.focus()
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (previouslyFocusedRef.current?.isConnected) {
        previouslyFocusedRef.current.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className="bottom-sheet-layer">
      <button
        className="bottom-sheet-layer__backdrop"
        type="button"
        tabIndex={-1}
        aria-label="Close details backdrop"
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="bottom-sheet__handle" aria-hidden="true" />
        <button
          ref={closeButtonRef}
          className="bottom-sheet__close"
          type="button"
          aria-label="Close details"
          onClick={onClose}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="bottom-sheet__content">{children}</div>
      </section>
    </div>
  )
}
