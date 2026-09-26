import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maze Bank — The Bank of Los Santos",
  description: "Secure online banking from Maze Bank.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
