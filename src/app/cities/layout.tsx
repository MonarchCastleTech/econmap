import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Cities — EconMap",
  description: "Every city knowledge base. Browse, search, and explore cities worldwide.",
};

export default function CitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
