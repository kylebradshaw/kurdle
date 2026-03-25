import { GameState, GameMode, GamePosition, GameStats, CombinedLetter, GameTime } from './game';
import { GuessClass, GuessFinal } from './guess';

describe('Game Models', () => {
  describe('GameState', () => {
    it('has all expected enum values', () => {
      expect(GameState.INITIALIZED).toBe('INITIALIZED');
      expect(GameState.PLAYING).toBe('PLAYING');
      expect(GameState.PAUSED).toBe('PAUSED');
      expect(GameState.ENDED).toBe('ENDED');
      expect(GameState.RESTORED).toBe('RESTORED');
      expect(GameState.SKIP).toBe('SKIP');
    });
  });

  describe('GameMode', () => {
    it('has SEQUENCE and RANDOM', () => {
      expect(GameMode.SEQUENCE).toBe('SEQUENCE');
      expect(GameMode.RANDOM).toBe('RANDOM');
    });
  });

  describe('GamePosition', () => {
    it('is a tuple of [number, number]', () => {
      const pos: GamePosition = [2, 3];
      expect(pos[0]).toBe(2);
      expect(pos[1]).toBe(3);
    });
  });

  describe('GameStats', () => {
    it('can be constructed with all fields', () => {
      const guesses: GuessFinal = { "1": 0, "2": 1, "3": 2, "4": 0, "5": 0, "6": 0 };
      const stats: GameStats = {
        currentStreak: 3,
        maxStreak: 5,
        guesses,
        gamesPlayed: 10,
        gamesWon: 7,
      };
      expect(stats.currentStreak).toBe(3);
      expect(stats.maxStreak).toBe(5);
      expect(stats.gamesPlayed).toBe(10);
      expect(stats.gamesWon).toBe(7);
      expect(stats.guesses["2"]).toBe(1);
    });
  });

  describe('CombinedLetter', () => {
    it('can be constructed with letter and class', () => {
      const cl: CombinedLetter = { letter: 'a', class: GuessClass.MATCH };
      expect(cl.letter).toBe('a');
      expect(cl.class).toBe(GuessClass.MATCH);
    });
  });

  describe('GameTime', () => {
    it('can be constructed with hours, minutes, seconds', () => {
      const gt: GameTime = { hours: 1, minutes: 30, seconds: 45 };
      expect(gt.hours).toBe(1);
      expect(gt.minutes).toBe(30);
      expect(gt.seconds).toBe(45);
    });
  });
});
