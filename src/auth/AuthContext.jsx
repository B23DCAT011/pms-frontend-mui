import { createContext, useContext, useState, useEffect } from "react";
import { login as loginRequest, getme, logout as logoutRequest } from "../api/auth.js";

const AuthContext = createContext(null);

let unauthorizedHandler = () => { };

export function notifyUnauthorized() {
  unauthorizedHandler();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access")
    if (!token) {
      setLoading(false);
      return;
    }
    getme()
      .then((user) => setUser(user))
      .catch(() => {
        localStorage.removeItem("access")
        localStorage.removeItem("refresh")
      })
      .finally(() => setLoading(false))
  }, [])

  // Đăng ký "lối thoát" để notifyUnauthorized() (gọi từ client.js) biết
  // phải làm gì: dọn token + xoá user, vì client.js không tự setUser được.
  useEffect(() => {
    unauthorizedHandler = () => {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      setUser(null);
    };
  }, []);

  async function login(username, password) {
    const { access, refresh, user } = await loginRequest(username, password);
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    setUser(user);
  }

  async function logout() {
    const refresh = localStorage.getItem("refresh");
    try {
      await logoutRequest(refresh);
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      setUser(null);
    }
  }

  function updateUser(patch) {
    setUser((prev) => ({ ...prev, ...patch }));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext);
}
