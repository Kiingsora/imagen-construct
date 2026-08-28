import type { ProjectDocument } from "@imagen-construct/contracts";

import { buildProjectAssetUrl } from "./project-api";

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load project asset: ${source}`));
    image.src = source;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode the project as PNG."));
    }, "image/png");
  });
}

function safeFileName(name: string): string {
  const normalized = name.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || "imagen-construct-export";
}

export async function exportProjectPng(project: ProjectDocument): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = project.canvas.width;
  canvas.height = project.canvas.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas export is unavailable in this browser.");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = project.canvas.backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (const layer of project.layers) {
    if (!layer.visible || layer.opacity <= 0) continue;
    const image = await loadImage(buildProjectAssetUrl(project.id, layer.asset.path));
    context.save();
    context.globalAlpha = layer.opacity;
    context.translate(layer.transform.x, layer.transform.y);
    context.rotate((layer.transform.rotation * Math.PI) / 180);
    context.scale(layer.transform.scaleX, layer.transform.scaleY);
    context.drawImage(image, 0, 0, layer.asset.width, layer.asset.height);
    context.restore();
  }

  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFileName(project.name)}.png`;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
