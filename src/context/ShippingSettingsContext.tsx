"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
} from "@/lib/data";
import type { ShippingSettings } from "@/types/admin-settings";

const defaults: ShippingSettings = {
  shippingFee: SHIPPING_FEE,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
};

const ShippingSettingsContext = createContext<ShippingSettings>(defaults);

export function ShippingSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ShippingSettings>(defaults);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/shipping-settings");
      if (!response.ok) return;
      const data = (await response.json()) as ShippingSettings;
      if (
        Number.isFinite(data.shippingFee) &&
        Number.isFinite(data.freeShippingThreshold)
      ) {
        setSettings({
          shippingFee: data.shippingFee,
          freeShippingThreshold: data.freeShippingThreshold,
        });
      }
    } catch {
      // Keep defaults when the API is unavailable.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(() => settings, [settings]);

  return (
    <ShippingSettingsContext.Provider value={value}>
      {children}
    </ShippingSettingsContext.Provider>
  );
}

export function useShippingSettings() {
  return useContext(ShippingSettingsContext);
}
