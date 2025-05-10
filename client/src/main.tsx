import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
// import App from './App.tsx' // 你可能有一个主要的 App 组件作为主页
import './index.css' // 如果你有全局样式

// 一个简单的主页占位符，或者你的实际主应用组件
const HomePage = () => (
    <div>
        <h1>欢迎来到家庭图书馆!</h1>
        <nav>
            <Link to="/login">登录</Link> | <Link to="/register">注册</Link>
        </nav>
        {/* TODO: 这里将来会根据登录状态显示不同的内容 */}
    </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} /> {/* 假设 HomePage 是你的主页 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* 你可能还需要一个主应用组件 <Route path="/app/*" element={<App />} /> 或类似结构 */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
