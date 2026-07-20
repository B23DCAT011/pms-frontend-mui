import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import './index.css'
import { ThemeModeProvider } from './theme/ThemeModeContext.jsx'
import { NotificationProvider } from './notifications/NotificationContext.jsx'
import { ConfirmProvider } from './confirm/ConfirmContext.jsx'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeModeProvider>
      <NotificationProvider>
        <ConfirmProvider>
          <AuthProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </ConfirmProvider>
      </NotificationProvider>
    </ThemeModeProvider>
  </StrictMode>,
)
