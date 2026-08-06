import axios from "axios"
import { notifyUnauthorized } from "../auth/AuthContext.jsx"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"

const apiClient = axios.create({ baseURL: BASE_URL })

// Gắn access token vào mọi request, nếu đã đăng nhập.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null

function requestNewTokens() {
  const refresh = localStorage.getItem("refresh")
  if (!refresh) {
    return Promise.reject(new Error("No refresh token"))
  }
  // axios "trần" (không qua apiClient) để không bị chính interceptor response bắt lại.
  return axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh }).then(({ data }) => {
    const { access, refresh: newRefresh } = data.data
    localStorage.setItem("access", access)
    localStorage.setItem("refresh", newRefresh)
    return access
  })
}

// Backend bật ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION nên refresh token là
// DÙNG-MỘT-LẦN: xoay vòng xong là token cũ bị vô hiệu vĩnh viễn.
//
// localStorage dùng chung giữa các tab, nhưng biến JS thì mỗi tab một bản riêng — nên
// `refreshPromise` bên dưới chỉ gộp được request TRONG CÙNG một tab. Các tab dùng chung một
// access token nên hết hạn cùng lúc, và tab nào cũng tự phát request mỗi 30s (polling thông
// báo) → nhiều tab cùng gửi đúng một refresh token đi. Tab đầu thắng, tab sau nhận 401 vì
// token vừa bị blacklist, rồi xoá sạch localStorage — kéo theo cả tab thắng cũng văng ra,
// dù phiên đăng nhập vẫn còn hiệu lực.
//
// navigator.locks là khoá dùng chung giữa mọi tab cùng origin: chỉ tab giữ khoá mới gọi
// mạng; tab chờ xong thấy refresh token đã khác lúc đầu thì biết tab kia vừa làm hộ rồi,
// dùng luôn access token mới thay vì gọi refresh lần hai (chắc chắn hỏng).
function refreshAccessToken() {
  // Web Locks cần secure context; localhost và https đều có. Không có thì giữ hành vi cũ.
  if (!navigator.locks) {
    return requestNewTokens()
  }
  const before = localStorage.getItem("refresh")
  return navigator.locks.request("pms-token-refresh", () => {
    const current = localStorage.getItem("refresh")
    if (current && current !== before) {
      return localStorage.getItem("access")
    }
    return requestNewTokens()
  })
}

// Bóc envelope { success, data, message, errors } ngay ở tầng interceptor,
// để phần còn lại của app chỉ cần làm việc với data thô hoặc lỗi thô.
apiClient.interceptors.response.use(
  (response) => {
    const { data, message } = response.data
    return data === null && message ? { detail: message } : data
  },
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (status === 401 && !original._retry) {
      original._retry = true
      try {
        // Nhiều request cùng bị 401 một lúc thì chỉ refresh 1 lần.
        refreshPromise = refreshPromise || refreshAccessToken()
        const access = await refreshPromise
        refreshPromise = null
        original.headers.Authorization = `Bearer ${access}`
        return apiClient(original)
      } catch {
        refreshPromise = null
        localStorage.removeItem("access")
        localStorage.removeItem("refresh")
        notifyUnauthorized()
      }
    }

    const envelope = error.response?.data
    return Promise.reject({
      status,
      message: envelope?.message || error.message,
      errors: envelope?.errors || null,
    })
  },
)

// Lấy 1 câu để hiện cho người dùng, dùng cho chỗ chỉ có 1 dòng thông báo (không phải
// helperText của từng ô). Cần vì `errors` có HAI hình dạng tuỳ cách backend ném lỗi:
//   raise ValidationError("chuỗi trần")      -> mảng   ["OTP không đúng hoặc đã hết hạn."]
//   validator của serializer / dict tường minh -> dict {"new_password": ["This password…"]}
// Và `message` của mọi lỗi validate đều là chuỗi kỹ thuật "Validation error" — đọc thẳng
// nó ra màn hình là thứ người dùng từng thấy thay cho câu tiếng Việt thật.
export function firstErrorMessage(err, fallback) {
  const errors = err?.errors
  if (Array.isArray(errors) && errors.length) return String(errors[0])
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).find((v) => (Array.isArray(v) ? v.length : v))
    if (first) return String(Array.isArray(first) ? first[0] : first)
  }
  if (err?.message && err.message !== "Validation error") return err.message
  return fallback
}

export default apiClient
