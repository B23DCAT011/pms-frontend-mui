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

function refreshAccessToken() {
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

export default apiClient
