import { nextRoundTime, forceRefresh } from './index';

describe('Helpers Index', () => {
  it('re-exports nextRoundTime', () => {
    expect(typeof nextRoundTime).toBe('function');
  });

  it('re-exports forceRefresh', () => {
    expect(typeof forceRefresh).toBe('function');
  });
});
