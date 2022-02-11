export type GamePosition = [number, number];
export enum GameState {
  INITIALIZED = 'INITIALIZED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
  RESTORED = 'RESTORED',
}
