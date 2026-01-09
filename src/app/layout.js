import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { PlayerProvider } from "@/context/PlayerContext";
import MainLayout from "@/components/MainLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Needle 0.1",
  description: "Premium music streaming experience",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <PlayerProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
