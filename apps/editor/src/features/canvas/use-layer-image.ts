import { useEffect, useState } from "react";

export function useLayerImage(source: string | null): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!source) {
      setImage(null);
      return;
    }

    let cancelled = false;
    const element = new window.Image();
    element.crossOrigin = "anonymous";
    element.decoding = "async";
    element.onload = () => {
      if (!cancelled) setImage(element);
    };
    element.onerror = () => {
      if (!cancelled) setImage(null);
    };
    element.src = source;

    return () => {
      cancelled = true;
      element.onload = null;
      element.onerror = null;
    };
  }, [source]);

  return image;
}
