import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PyOJ Classroom",
  description: "파이썬 초급 Online Judge 학습 플랫폼"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
