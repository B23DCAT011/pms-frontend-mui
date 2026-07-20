import apiClient from "./client.js"

export function login(username, password) {
  return apiClient.post("/auth/login/", { username, password })
}

export function refreshToken(refresh) {
  return apiClient.post("/auth/token/refresh/", { refresh })
}

export function getme() {
  return apiClient.get("/auth/me/")
}

export function updateMe(payload) {
  return apiClient.patch("/auth/me/", payload)
}

export function logout(refresh) {
  return apiClient.post("/auth/logout/", { refresh })
}

export function register(payload) {
  return apiClient.post("/auth/register/", payload)
}

export function verifyOtp(email, otp) {
  return apiClient.post("/auth/verify-otp/", { email, otp })
}

export function resendOtp(email) {
  return apiClient.post("/auth/resend-otp/", { email })
}

export function forgotPassword(email) {
  return apiClient.post("/auth/forgot-password/", { email })
}

export function resetPassword(email, otp, new_password) {
  return apiClient.post("/auth/reset-password/", { email, otp, new_password })
}

export function changePassword(old_password, new_password) {
  return apiClient.post("/auth/change-password/", { old_password, new_password })
}

export function requestChangeEmail(new_email) {
  return apiClient.post("/auth/change-email/", { new_email })
}

export function verifyChangeEmail(otp) {
  return apiClient.post("/auth/verify-email-change/", { otp })
}
