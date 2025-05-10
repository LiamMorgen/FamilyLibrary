import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // 导入 path 模块

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { // 添加 resolve 配置
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000, // 你可以指定前端开发服务器的端口，例如3000
    proxy: {
      // 将所有 /api 开头的请求代理到后端
      '/api': {
        target: 'http://localhost:8080', // 你的 Spring Boot 后端地址
        changeOrigin: true, // 需要虚拟主机站点
        // 可选：如果你的后端API路径没有统一的/api前缀，可能需要路径重写
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
