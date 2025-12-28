
export interface Point {
  x: number;
  y: number;
}

export interface SingleHandData {
  landmarks: Point[];
  isPinching: boolean;
  cursor: Point;
  label: 'Left' | 'Right';
}

export interface HandData {
  hands: SingleHandData[];
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  AIR_CANVAS = 'air-canvas',
  VISION_LENS = 'vision-lens',
  HAND_MIMIC = 'hand-mimic',
  SETTINGS = 'settings'
}

export interface GeminiResponse {
  text: string;
  timestamp: number;
}
