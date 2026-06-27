import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HubMath",
  description: "ระบบจัดการงานและห้องเรียนคณิตศาสตร์",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
