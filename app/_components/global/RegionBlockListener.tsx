"use client";

import { useEffect } from "react";

export default function RegionBlockListener() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const alRecibir = (e: MessageEvent) => {
      if (e.data?.type === "REGION_BLOCKED") window.location.reload();
    };

    navigator.serviceWorker.addEventListener("message", alRecibir);
    return () =>
      navigator.serviceWorker.removeEventListener("message", alRecibir);
  }, []);

  return null;
}