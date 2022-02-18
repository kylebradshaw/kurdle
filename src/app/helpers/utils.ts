import { GameMode, GameTime } from "src/app/models/game";

export const nextRoundTime = (expires: string): GameTime => {
  const left = new Date(expires).getTime() - (new Date().getTime());
  return {
    seconds: Math.floor((left % 6e4) / 1e3),
    minutes: Math.floor((left % 36e5) / 6e4),
    hours: Math.floor((left % 864e5) / 36e5),
  }
};

/**
 * forceRefresh is a way to toggle GameState with hard reloads
 * @param randomPls boolean value to toggle between SEQUENCE and RANDOM game modes
 * if ?rando=true is added to the URL, the FE will request a word at a random sequenceIdx
 * if ?rando=false is added to the URL, the FE will request a word in sequence (sets sequenceIdx === 0)
 */
export const forceRefresh = (gameMode: GameMode): void => {
  const l = window.location;
  if (gameMode === GameMode.RANDOM && !l.href.includes('rando')) {
    // entering RANDOM gameplay for the first time
    l.href = l.href.includes(`?`) ? `${l.href}/${l.search}&rando=true` : `${l.href}?rando=true`;
  } else if (gameMode === GameMode.RANDOM && l.href.includes('rando')) {
    // already in RANDOM gameplay but want a different index
    window.location.reload();
  } else if (gameMode === GameMode.SEQUENCE) {
    // start SEQUENCE gameplay
    window.location.href = window.origin;
  } else {
    return;
  }
};
