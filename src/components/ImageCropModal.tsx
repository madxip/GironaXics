"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { X, Check, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

// ── Helper: Canvas crop ──────────────────────────────────────────────────────
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      },
      "image/jpeg",
      0.93
    );
  });
}

// ── Tipus ────────────────────────────────────────────────────────────────────
interface ImageCropModalProps {
  imageSrc: string;
  fileName?: string;
  onConfirm: (croppedBlob: Blob, fileName: string) => void;
  onCancel: () => void;
  aspect?: number | null; // null = lliure
}

const ASPECT_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Lliure", value: null },
  { label: "16:5", value: 16 / 5 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "1:1", value: 1 },
  { label: "3:4", value: 3 / 4 },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function ImageCropModal({
  imageSrc,
  fileName = "imatge.jpg",
  onConfirm,
  onCancel,
  aspect: initialAspect = 4 / 3,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aspect, setAspect] = useState<number | null>(initialAspect);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
      const croppedName = fileName.replace(/\.[^.]+$/, `_crop.${ext === "png" ? "png" : "jpg"}`);
      onConfirm(blob, croppedName);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* Capçalera */}
      <div style={{
        width: "100%", maxWidth: "800px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 20px", color: "white",
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            ✂️ Retallar imatge
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
            Arrossega per moure · Roda per fer zoom
          </p>
        </div>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px" }}>
          <X size={22} />
        </button>
      </div>

      {/* Hint */}
      <div style={{
        width: "100%", maxWidth: "800px",
        padding: "8px 20px",
        backgroundColor: "rgba(99,102,241,0.2)",
        borderLeft: "3px solid #6366f1",
        marginBottom: "8px",
      }}>
        <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>
          💡 <strong>Consell:</strong> Centra el contingut principal — es veurà igual a mòbil i escriptori.
        </p>
      </div>

      {/* Àrea de crop */}
      <div style={{
        position: "relative",
        width: "100%", maxWidth: "800px",
        height: "420px",
        backgroundColor: "#111",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect ?? undefined}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { borderRadius: "12px" },
            cropAreaStyle: { border: "2px solid var(--verd)", boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" },
          }}
        />
      </div>

      {/* Controls */}
      <div style={{
        width: "100%", maxWidth: "800px",
        padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: "16px",
      }}>
        {/* Zoom */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setZoom(z => Math.max(1, z - 0.1))}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "4px" }}>
            <ZoomOut size={18} />
          </button>
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--verd)" }}
          />
          <button onClick={() => setZoom(z => Math.min(3, z + 0.1))}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "4px" }}>
            <ZoomIn size={18} />
          </button>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", minWidth: "36px" }}>
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Proporció + Botons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          {/* Selector de proporció */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Maximize2 size={14} color="rgba(255,255,255,0.5)" />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Proporció:</span>
            {ASPECT_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => setAspect(opt.value)}
                style={{
                  padding: "5px 10px", borderRadius: "16px", border: "1.5px solid",
                  fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  borderColor: aspect === opt.value ? "var(--verd)" : "rgba(255,255,255,0.2)",
                  backgroundColor: aspect === opt.value ? "var(--verd)" : "transparent",
                  color: "white",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Botons d'acció */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onCancel}
              style={{
                padding: "10px 20px", borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent", color: "white",
                cursor: "pointer", fontSize: "14px", fontWeight: 500,
              }}
            >
              Cancel·lar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              style={{
                padding: "10px 24px", borderRadius: "8px",
                border: "none",
                background: "var(--verd)", color: "white",
                cursor: isProcessing ? "wait" : "pointer",
                fontSize: "14px", fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: "8px",
                opacity: isProcessing ? 0.7 : 1,
              }}
            >
              <Check size={16} />
              {isProcessing ? "Processant..." : "Aplicar retall"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
