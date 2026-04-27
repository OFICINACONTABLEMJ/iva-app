import "./globals.css";
import { UserProvider } from "./context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-100">

        <UserProvider>
          <div className="flex min-h-screen">

            {/* SIDEBAR */}
            <Sidebar />

            {/* CONTENIDO */}
            <div className="flex-1 p-6">
              {children}
            </div>

          </div>
        </UserProvider>

        {/* 🔥 AQUÍ VA ANALYTICS */}
        <Analytics />

      </body>
    </html>
  );
}