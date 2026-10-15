import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { publicAppConfig } from "@/lib/config/public-app-config";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

const { appName } = publicAppConfig;

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description:
    "Sistema de Gestão Patrimonial da Câmara Municipal de Patos de Minas.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body>
        {children}

        <WebVitalsReporter />

        <Toaster position="bottom-right" richColors closeButton theme="light" />
      </body>
    </html>
  );
}
