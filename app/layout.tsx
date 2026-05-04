import './globals.css';

export const metadata = {
  title: '發票推卡 - 一次性信用卡推薦',
  description: '上傳財政部電子發票 CSV，獲得未來一年預期回饋最大的 5 張卡組合。純前端去識別化，不儲存任何明細。'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
