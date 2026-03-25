import { Notice } from './notice';

describe('Notice Model', () => {
  it('can be constructed with message, type, and again', () => {
    const notice: Notice = { message: 'Hello', type: 'warn', again: true };
    expect(notice.message).toBe('Hello');
    expect(notice.type).toBe('warn');
    expect(notice.again).toBe(true);
  });

  it('can represent an empty notice', () => {
    const notice: Notice = { message: '', type: '', again: false };
    expect(notice.message).toBe('');
    expect(notice.type).toBe('');
    expect(notice.again).toBe(false);
  });
});
