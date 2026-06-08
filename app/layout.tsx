import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { SessionProvider } from "@/components/auth/session-provider";
import "./globals.css";

const popinsSans = Poppins({
  variable: "--font-poppins-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Envichips - SaaS",
  description: "Punto de venta y gestión de negocio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${popinsSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
