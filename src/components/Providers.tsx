"use client";

import { useCallback, useState } from "react";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/context/CartContext";
import FloatingNav from "./FloatingNav";
import SplashScreen from "./SplashScreen";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [appReady, setAppReady] = useState(false);
  const handleSplashComplete = useCallback(() => setAppReady(true), []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <CartProvider>
        <SplashScreen onComplete={handleSplashComplete} />
        {appReady && (
          <>
            {children}
            <FloatingNav />
          </>
        )}
      </CartProvider>
    </ThemeProvider>
  );
}
