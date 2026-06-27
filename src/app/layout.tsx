import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบห้องเรียน",
  description: "ระบบจัดการงานและห้องเรียน",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
