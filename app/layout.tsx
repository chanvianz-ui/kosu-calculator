import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kosu Calculator",
  description: "Kalkulator persentase Kosu dan rekap stok harian.",
  applicationName: "Kosu Calculator",
  themeColor: "#0b1010",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
