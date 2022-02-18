import { GameTime } from "src/app/models/game";

export const nextRoundTime = (expires: string): GameTime => {
  const left = new Date(expires).getTime() - (new Date().getTime());
  return {
    seconds: Math.floor((left % 6e4) / 1e3),
    minutes: Math.floor((left % 36e5) / 6e4),
    hours: Math.floor((left % 864e5) / 36e5),
  }
};

export const forceRefresh = (randomPls: boolean): void => {
  const l = window.location;
  if (randomPls && !l.href.includes('rando')) {
    l.href = l.href.includes(`?`) ? `${l.href}/${l.search}&rando=true` : `${l.href}?rando=true`;
  } else if (randomPls && l.href.includes('rando')) {
    window.location.reload();
  } else {
    window.location.href = window.origin;
  }
};
