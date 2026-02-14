export enum ToolMode {
  BRUSH = 'BRUSH',
  HAND = 'HAND',
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  size: number;
}

export interface CanvasState {
  scale: number;
  offset: Point;
}

export interface ImageDimensions {
  width: number;
  height: number;
}
