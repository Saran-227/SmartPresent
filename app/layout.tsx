import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthWrapper } from "@/components/auth-wrapper"
import "./globals.css"

export const metadata: Metadata = {
  title: "SmartPresent - Teacher Dashboard",
  description: "Professional attendance management system for educators",
  generator: "SmartPresent v1.0",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthWrapper>
            <div className="dashboard-container">{children}</div>
          </AuthWrapper>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
