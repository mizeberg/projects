/** Compile-time platform boundary. Android never calls the sandbox's web API. */
export const isNativeApp = import.meta.env.VITE_NATIVE_ANDROID === "true";

declare global {
  interface Window {
    GateNovaAndroid?: { exportNote(title: string, body: string): void };
    __gatenovaBack?: () => boolean;
  }
}

export function exportTextNote(title: string, body: string) {
  if (isNativeApp && window.GateNovaAndroid) {
    window.GateNovaAndroid.exportNote(title.slice(0, 200), body);
    return;
  }
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const name =
    title.replace(/[^\p{L}\p{N} ._-]/gu, "_").trim() || "GATENOVA note";
  anchor.download = name.endsWith(".txt") ? name : `${name}.txt`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
