export type ToastData = {
  message: string;
  actionLabel: string;
  callback?: () => void;
};

export type Point2D = {
  x: number;
  y: number;
};

export type DetectedBarcode = {
  boundingBox: DOMRectReadOnly;
  cornerPoints: Array<Point2D>;
  format: string;
  rawValue: string;
};