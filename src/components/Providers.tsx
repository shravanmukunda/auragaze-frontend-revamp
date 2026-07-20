"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { CatalogProvider } from "@/context/CatalogContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import FloatingNav from "./FloatingNav";
import Footer from "./Footer";
import SplashScreen from "./SplashScreen";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [appReady, setAppReady] = useState(false);
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const handleSplashComplete = useCallback(() => setAppReady(true), []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SessionProvider>
        <CatalogProvider>
          <CartProvider>
            <WishlistProvider>
              {!isAdminRoute && (
                <SplashScreen onComplete={handleSplashComplete} />
              )}
              {children}
              <Toaster richColors position="top-center" />
              {appReady && !isAdminRoute && (
                <>
                  <Footer />
                  <FloatingNav />
                </>
              )}
            </WishlistProvider>
          </CartProvider>
        </CatalogProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
