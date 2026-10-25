import type { Metadata } from "next";
import { HomeDashboard } from "./_home/home-dashboard";
import { publicAppConfig } from "@/lib/config/public-app-config";

export const metadata: Metadata = {
  title: `Visão geral | ${publicAppConfig.appName}`,
  description: "Visão geral ilustrativa da gestão patrimonial do SIPAT.",
};

export default function Home() {
  return <HomeDashboard />;
}
