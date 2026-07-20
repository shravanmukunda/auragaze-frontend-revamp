export const PROMO_STORAGE_KEY = "agz_promo_code";

export function getStoredPromoCode() {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(PROMO_STORAGE_KEY);
  return value?.trim().toUpperCase() || null;
}

export function setStoredPromoCode(code: string | null) {
  if (typeof window === "undefined") return;
  if (!code) {
    window.sessionStorage.removeItem(PROMO_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(PROMO_STORAGE_KEY, code.trim().toUpperCase());
}
