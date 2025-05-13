import { useCallback } from 'react';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  // 这里假设你已经有全局 Toaster 组件（如 shadcn/ui 的 Toaster）
  // 你可以用 window 事件、context 或第三方库实现
  // 这里只是一个简单的实现示例
  const toast = useCallback((options: ToastOptions) => {
    // 你可以用第三方库如 react-hot-toast 或自定义事件
    // 这里只是简单用 alert 代替
    if (options.variant === 'destructive') {
      alert(`❌ ${options.title || ''}\n${options.description || ''}`);
    } else {
      alert(`✅ ${options.title || ''}\n${options.description || ''}`);
    }
  }, []);

  return { toast };
} 