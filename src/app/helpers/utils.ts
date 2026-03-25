import { GameMode, GameTime } from "src/app/models/game";

export const nextRoundTime = (expires: string): GameTime => {
  const left = new Date(expires).getTime() - (new Date().getTime());
  return {
    seconds: Math.floor((left % 6e4) / 1e3),
    minutes: Math.floor((left % 36e5) / 6e4),
    hours: Math.floor((left % 864e5) / 36e5),
  }
};

export interface LocationLike {
  href: string;
  origin: string;
  search: string;
  reload(): void;
}

/**
 * forceRefresh is a way to toggle GameState with hard reloads
 * if ?rando=true is added to the URL, the FE will request a word at a random sequenceIdx
 * if ?rando=false is added to the URL, the FE will request a word in sequence (sets sequenceIdx === 0)
 */
export const forceRefresh = (gameMode: GameMode, loc: LocationLike = window.location): void => {
  if (gameMode === GameMode.RANDOM && !loc.href.includes('rando')) {
    loc.href = loc.href.includes(`?`) ? `${loc.href}/${loc.search}&rando=true` : `${loc.href}?rando=true`;
  } else if (gameMode === GameMode.RANDOM && loc.href.includes('rando')) {
    loc.reload();
  } else if (gameMode === GameMode.SEQUENCE) {
    loc.href = loc.origin;
  } else {
    return;
  }
};
