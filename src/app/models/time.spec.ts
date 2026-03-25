import { EST_OFFSET_MS_FROM_UTC } from './time';

describe('Time Model', () => {
  it('EST_OFFSET_MS_FROM_UTC is 18,000,000 ms (5 hours)', () => {
    expect(EST_OFFSET_MS_FROM_UTC).toBe(18e6);
    expect(EST_OFFSET_MS_FROM_UTC).toBe(18000000);
  });
});
