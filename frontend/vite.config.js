// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cấu hình giúp Vite nhận diện và biên dịch mượt mà cú pháp JSX của React
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Ép chạy cố định ở cổng 5173
    host: true  // Cho phép mở rộng kết nối mạng nội bộ nếu cần
  }
});