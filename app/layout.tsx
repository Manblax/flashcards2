import type { Metadata } from "next";
import "./globals.css";
import MainLayout from "@/components/layout/MainLayout";

export const metadata: Metadata = {
  title: "FlashCards2",
  description: "Приложение для изучения с флэш-карточками",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="dark">
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}

