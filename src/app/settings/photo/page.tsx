"use client";

import { useState, useEffect } from "react";
import { GooglePhotosLogo, ICloudLogo, DropboxLogo, GoogleDriveLogo } from "@/components/ui/BrandLogos";

const INTEGRATIONS = [
  {
    key: "google_photos",
    name: "Google Photos",
    description: "Import photos directly from your Google Photos library.",
    logo: <GooglePhotosLogo className="h-9 w-9" />,
    soon: false,
    connectable: false,
  },
  {
    key: "icloud",
    name: "iCloud Photos",
    description: "Coming soon.",
    logo: <ICloudLogo className="h-9 w-9" />,
    soon: true,
    connectable: false,
  },
  {
    key: "dropbox",
    name: "Dropbox",
    description: "Pull images from your Dropbox folders when creating a listing.",
    logo: <DropboxLogo className="h-9 w-9" />,
    soon: false,
    connectable: true,
  },
  {
    key: "google_drive",
    name: "Google Drive",
    description: "Coming soon.",
    logo: <GoogleDriveLogo className="h-9 w-9" />,
    soon: true,
    connectable: false,
  },
];

export default function PhotoPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setEnabled({ dropbox: localStorage.getItem("dropbox_enabled") === "true" });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function handleConnect(key: string, name: string) {
    localStorage.setItem(`${key}_enabled`, "true");
    setEnabled((prev) => ({ ...prev, [key]: true }));
    setToast(`${name} has been enabled. You can now import photos from ${name} when creating a listing.`);
  }

  function handleDisconnect(key: string, name: string) {
    localStorage.removeItem(`${key}_enabled`);
    setEnabled((prev) => ({ ...prev, [key]: false }));
    setToast(`${name} has been disconnected.`);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toast */}
      {toast && (
        <div className="rounded-lg px-4 py-3 text-sm font-medium bg-primary/8 text-primary border border-primary/20 animate-in fade-in slide-in-from-top-1 duration-200">
          {toast}
        </div>
      )}

      <div className="rounded-xl border border-surface-variant bg-surface shadow-card p-6">
        <h2 className="text-sm font-semibold text-on-surface mb-1">Photo Integrations</h2>
        <p className="text-xs text-secondary">Connect photo sources to quickly pull product images when creating a listing.</p>
      </div>

      <div className="flex flex-col gap-3">
        {INTEGRATIONS.map((item) => {
          const isEnabled = !!enabled[item.key];

          return (
            <div key={item.key} className="rounded-xl border border-surface-variant bg-surface shadow-card px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center shrink-0">
                  {item.logo}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-on-surface">{item.name}</p>
                    {isEnabled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Enabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary">{item.description}</p>
                </div>
              </div>

              {item.soon ? (
                <span className="self-start sm:self-auto rounded-full bg-surface-low px-2.5 py-1 text-xs text-secondary">Coming soon</span>
              ) : isEnabled ? (
                <button
                  onClick={() => handleDisconnect(item.key, item.name)}
                  className="self-start sm:self-auto rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/5 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => item.connectable && handleConnect(item.key, item.name)}
                  className="self-start sm:self-auto rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
