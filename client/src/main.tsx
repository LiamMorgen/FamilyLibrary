import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n' // Import to initialize i18next
// import './index.css'; // 如果你有全局样式 (暂时注释掉，让来自 index.html 的样式优先)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
