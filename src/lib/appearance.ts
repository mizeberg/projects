import { useEffect, useState } from "react";
export type Appearance = "dark" | "light" | "system";
const key = "gatenova:appearance:v1";
export function readAppearance(): Appearance {
  try {
    const value = localStorage.getItem(key);
    if (value === "light" || value === "system") return value;
  } catch {
    /* Storage may be unavailable in private browsing. */
  }
  return "dark";
}
export function applyAppearance(preference: Appearance): "dark" | "light" {
  const system =
    window.GateNovaAndroid?.getSystemAppearance?.() ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const theme = preference === "system" ? system : preference;
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#08090b" : "#f5f5f7");
  window.GateNovaAndroid?.setAppearance?.(theme);
  return theme;
}
export function useAppearance() {
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);
  const [resolved, setResolved] = useState<"dark" | "light">(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );
  useEffect(() => {
    const update = () => setResolved(applyAppearance(appearance));
    update();
    try {
      localStorage.setItem(key, appearance);
    } catch {
      /* Keep the selected look for this session. */
    }
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    window.addEventListener("gatenova:system-appearance", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("gatenova:system-appearance", update);
    };
  }, [appearance]);
  return { appearance, setAppearance, resolved };
}
