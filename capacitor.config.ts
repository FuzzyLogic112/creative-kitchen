import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creativekitchen.app',
  appName: '创意厨房',
  webDir: 'dist',
  plugins: {
    // 启用原生 HTTP：App 内直连模型接口，绕过浏览器 CORS
    CapacitorHttp: { enabled: true },
  },
};

export default config;
