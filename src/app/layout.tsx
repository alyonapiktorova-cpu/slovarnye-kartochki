import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Словарные карточки",
  description: "Конструктор обучающих карточек для начальной школы"
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ru"><body>{children}</body></html>;
}