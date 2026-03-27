import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NimbleCRM — AI-Powered by Nimbleworx",
  description: "Relationship intelligence CRM that keeps itself up to date.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
