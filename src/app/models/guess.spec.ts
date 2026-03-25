import { GuessClass, GuessAction, AlphaDict, GuessLetter, GuessFinal } from './guess';

describe('Guess Models', () => {
  describe('GuessClass', () => {
    it('has all expected enum values', () => {
      expect(GuessClass.MISMATCH).toBe('mismatch');
      expect(GuessClass.MATCH).toBe('match');
      expect(GuessClass.DEFAULT).toBe('default');
      expect(GuessClass.USED).toBe('used');
      expect(GuessClass.GHOST).toBe('ghost');
    });
  });

  describe('GuessAction', () => {
    it('has ENTER and DEL', () => {
      expect(GuessAction.ENTER).toBe('\u23CE');
      expect(GuessAction.DEL).toBe('\u232B');
    });
  });

  describe('GuessLetter', () => {
    it('has class and idx', () => {
      const gl: GuessLetter = { class: GuessClass.MATCH, idx: [0, 3] };
      expect(gl.class).toBe(GuessClass.MATCH);
      expect(gl.idx).toEqual([0, 3]);
    });
  });

  describe('AlphaDict', () => {
    it('can map string keys to GuessLetter values', () => {
      const dict: AlphaDict = {
        a: { class: GuessClass.DEFAULT, idx: [] },
        b: { class: GuessClass.MATCH, idx: [1] },
      };
      expect(dict['a'].class).toBe(GuessClass.DEFAULT);
      expect(dict['b'].idx).toEqual([1]);
    });
  });

  describe('GuessFinal', () => {
    it('tracks guesses per round number', () => {
      const gf: GuessFinal = { "1": 5, "2": 3, "3": 1, "4": 0, "5": 0, "6": 0 };
      expect(gf["1"]).toBe(5);
      expect(gf["3"]).toBe(1);
    });
  });
});
