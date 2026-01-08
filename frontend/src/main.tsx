import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode temporarily disabled for WebSocket stability
// In StrictMode, effects run twice which can cause connection issues
createRoot(document.getElementById('root')!).render(
  <App />
)
