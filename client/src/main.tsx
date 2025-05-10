import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n' // Import to initialize i18next
import './index.css'; // Removed the comment to enable global styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
