import type { Metadata } from "next";
import "./globals.css";
import "@/lib/init"; // Initialize database

export const metadata: Metadata = {
  title: "ShelfHelp - Smart Grocery Lists",
  description: "Quickly generate grocery lists from your favorite recipes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
