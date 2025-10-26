import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shade Test",
  description: "Sunlit shade palette test",
};

export default function ShadeTestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
