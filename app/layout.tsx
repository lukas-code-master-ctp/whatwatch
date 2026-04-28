import type { Metadata } from "next"
import { Exo, Roboto_Mono } from "next/font/google"
import "./globals.css"

const exo = Exo({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-exo",
})

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto-mono",
})

export const metadata: Metadata = {
  title: "WhatWatch — ¿Qué vemos hoy?",
  description: "Elige la película perfecta con ayuda de IA",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${exo.variable} ${robotoMono.variable} bg-black text-[#F8FAFC] min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
