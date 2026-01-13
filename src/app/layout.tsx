import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import '@ant-design/v5-patch-for-react-19';
import { ConfigProvider } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";
import StyledComponentsRegistry from "../lib/styled-components-registry";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SaaS Energy Demo",
  description: "Demo multi-tenant energy management UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AntdRegistry>
        <html lang="en">
          <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <StyledComponentsRegistry>
            <Providers>{children}</Providers>
            </StyledComponentsRegistry>
          </body>
        </html>
    </AntdRegistry>
  );
}
