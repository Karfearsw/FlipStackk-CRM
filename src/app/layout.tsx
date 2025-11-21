"use client"

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Flipstackk CRM - Real Estate Deal Management</title>
        <meta name="description" content="Real Estate Deal Management Platform" />
      </head>
      <body
        className={`antialiased`}
      >
        <SessionProvider>
          <QueryProvider>
            <ThemeProvider defaultTheme="light" storageKey="nextjs-crm-ui-theme">
              {children}
              <Toaster />
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
