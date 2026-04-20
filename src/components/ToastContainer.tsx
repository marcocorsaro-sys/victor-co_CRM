import type { Toast } from '../hooks/useToast'

export default function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && '✓'}
          {t.type === 'error' && '✕'}
          {t.type === 'info' && 'ℹ'}
          {t.message}
        </div>
      ))}
    </div>
  )
}
