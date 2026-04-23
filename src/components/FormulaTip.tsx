import { useState, useRef, useEffect } from 'react'

type Props = {
  /** Title shown at the top of the overlay (e.g. "Stima Pesata 2026"). */
  title?: string
  /** Formula text or JSX. Supports line breaks in string form. */
  formula: string | React.ReactNode
  /** Optional extra notes shown below the formula. */
  note?: string
  /** Size in px (default 13). */
  size?: number
  /** Overlay horizontal anchor. */
  align?: 'left' | 'right' | 'center'
}

/**
 * Small ⓘ icon that reveals a legend overlay on hover/click.
 * Used to explain how a KPI / column value is computed.
 */
export default function FormulaTip({ title, formula, note, size = 13, align = 'left' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  // Close on outside click (mobile tap-to-open)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    ...(align === 'right' ? { right: 0 } : align === 'center' ? { left: '50%', transform: 'translateX(-50%)' } : { left: 0 }),
    zIndex: 1000,
    minWidth: 240,
    maxWidth: 340,
    padding: '10px 12px',
    borderRadius: 8,
    background: 'var(--s3, #1a1d24)',
    border: '1px solid var(--bd, #333)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    fontSize: 11,
    lineHeight: 1.45,
    color: 'var(--gl, #b8b8b8)',
    fontFamily: 'inherit',
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: 'normal',
    whiteSpace: 'normal',
    textAlign: 'left',
  }

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex', marginLeft: 4, verticalAlign: 'middle' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        aria-label={title ? `Formula: ${title}` : 'Formula'}
        style={{
          width: size + 3,
          height: size + 3,
          borderRadius: '50%',
          background: 'transparent',
          border: '1px solid var(--g, #666)',
          color: 'var(--g, #888)',
          fontSize: Math.max(size - 3, 9),
          fontWeight: 600,
          cursor: 'help',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          lineHeight: 1,
          fontFamily: 'serif',
          fontStyle: 'italic',
        }}
      >
        i
      </button>
      {open && (
        <div role="tooltip" style={panelStyle}>
          {title && (
            <div style={{ fontWeight: 600, color: 'var(--w, #fff)', marginBottom: 4, fontSize: 12 }}>
              {title}
            </div>
          )}
          <div>{formula}</div>
          {note && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--bd, #333)', color: 'var(--g, #888)', fontSize: 10 }}>
              {note}
            </div>
          )}
        </div>
      )}
    </span>
  )
}
