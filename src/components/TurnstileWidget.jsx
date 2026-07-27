import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// Bật captcha ở frontend = có cấu hình site key. Chưa set (dev) -> widget tự ẩn, submit không
// cần token; khớp với TURNSTILE_ENABLED=False bên backend.
export const turnstileEnabled = Boolean(SITE_KEY)

let scriptPromise = null

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
  return scriptPromise
}

// onVerify(token) mỗi khi có token mới; onVerify('') khi hết hạn/lỗi/bị reset.
// ref.reset() để lấy token mới sau khi submit hỏng (token Turnstile chỉ dùng được 1 lần).
const TurnstileWidget = forwardRef(function TurnstileWidget({ onVerify }, ref) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
        onVerify('')
      }
    },
  }))

  useEffect(() => {
    if (!turnstileEnabled) return undefined
    let cancelled = false
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: 'auto',
          callback: (token) => onVerify(token),
          'expired-callback': () => onVerify(''),
          'error-callback': () => onVerify(''),
        })
      })
      .catch(() => onVerify(''))

    return () => {
      cancelled = true
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [onVerify])

  if (!turnstileEnabled) return null

  return (
    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
      <div ref={containerRef} />
    </div>
  )
})

export default TurnstileWidget
