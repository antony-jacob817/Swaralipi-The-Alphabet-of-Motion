// src/types/sign.ts
export interface SignFrame {
  pose: number[];
  left_hand: number[];
  right_hand: number[];
}

export interface SignData {
  word: string;
  frames: SignFrame[];
}

export interface SignAnimationState {
  isPlaying: boolean;
  currentWord: string;
  currentFrame: number;
  totalFrames: number;
  progress: number;
}