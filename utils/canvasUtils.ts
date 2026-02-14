import { Stroke, Point, ImageDimensions } from "../types";

export const getDistance = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Generates a black and white mask image from the strokes.
 * Returns a Base64 string of the mask.
 */
export const generateMaskImage = (
  width: number,
  height: number,
  strokes: Stroke[]
): string => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  // Fill black (background)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  // Draw white strokes (mask)
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "white";

  strokes.forEach((stroke) => {
    if (stroke.points.length < 1) return;
    
    ctx.lineWidth = stroke.size;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    if (stroke.points.length === 1) {
        // Draw a dot
        ctx.fillStyle = "white";
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        stroke.points.forEach((point, index) => {
            if (index > 0) {
              ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
    }
  });

  return canvas.toDataURL("image/png");
};
