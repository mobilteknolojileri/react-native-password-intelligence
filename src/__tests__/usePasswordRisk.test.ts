import { renderHook } from '@testing-library/react-native';
import { usePasswordRisk } from '../hooks/usePasswordRisk';
import { clearCustomDictionary } from '../core/analyzer';

describe('usePasswordRisk', () => {
  beforeEach(() => {
    clearCustomDictionary();
  });

  it('returns score and feedback for a given password', () => {
    const { result } = renderHook(() => usePasswordRisk('password123'));

    expect(result.current.score).toBeDefined();
    expect(result.current.score).toBeLessThanOrEqual(2);
    expect(result.current.crackTimeDisplay).toBeDefined();
    expect(typeof result.current.crackTimeDisplay).toBe('string');
    expect(result.current.feedback).toBeDefined();
  });

  it('exposes the full zxcvbn result via raw', () => {
    const { result } = renderHook(() => usePasswordRisk('Xk9#mP2$vL7@nQ5!'));

    expect(result.current.raw).toBeDefined();
    expect(typeof result.current.raw.guesses).toBe('number');
    expect(Array.isArray(result.current.raw.sequence)).toBe(true);
  });

  it('memoizes the result when the password is the same', () => {
    const { result, rerender } = renderHook(
      ({ pw }: { pw: string }) => usePasswordRisk(pw),
      {
        initialProps: { pw: 'same-password' },
      }
    );

    const firstResult = result.current;
    rerender({ pw: 'same-password' });

    expect(result.current).toBe(firstResult);
  });

  it('recomputes when the password changes', () => {
    const { result, rerender } = renderHook(
      ({ pw }: { pw: string }) => usePasswordRisk(pw),
      {
        initialProps: { pw: 'first-password' },
      }
    );

    const firstResult = result.current;
    rerender({ pw: 'second-password' });

    expect(result.current).not.toBe(firstResult);
  });

  it('penalizes passwords containing userInputs', () => {
    const { result } = renderHook(() =>
      usePasswordRisk('mehmet1907', ['Mehmet', 'mehmet@example.com'])
    );

    expect(result.current.score).toBeLessThanOrEqual(2);
  });

  it('does not infinitely re-render when userInputs are passed inline', () => {
    let renderCount = 0;
    const { rerender } = renderHook(
      ({ pw }: { pw: string }) => {
        renderCount += 1;
        return usePasswordRisk(pw, ['John', 'Doe']);
      },
      { initialProps: { pw: 'static-pw' } }
    );

    const firstRenders = renderCount;
    rerender({ pw: 'static-pw' });
    rerender({ pw: 'static-pw' });

    expect(renderCount).toBe(firstRenders + 2);
  });

  it('memoizes when userInputs reference changes but values do not', () => {
    const { result, rerender } = renderHook(
      ({ inputs }: { inputs: string[] }) =>
        usePasswordRisk('static-pw', inputs),
      { initialProps: { inputs: ['John', 'Doe'] } }
    );

    const firstResult = result.current;
    rerender({ inputs: ['John', 'Doe'] });

    expect(result.current).toBe(firstResult);
  });

  it('recomputes when userInputs values change', () => {
    const { result, rerender } = renderHook(
      ({ inputs }: { inputs: string[] }) => usePasswordRisk('john1985', inputs),
      { initialProps: { inputs: ['Jane'] } }
    );

    const firstResult = result.current;
    rerender({ inputs: ['John'] });

    expect(result.current).not.toBe(firstResult);
  });

  it('accepts a readonly userInputs tuple (as const)', () => {
    const inputs = ['Mehmet', 'mehmet@example.com'] as const;
    const { result } = renderHook(() => usePasswordRisk('mehmet1907', inputs));

    expect(result.current.score).toBeLessThanOrEqual(2);
  });

  it('handles undefined userInputs without crashing', () => {
    const { result } = renderHook(() => usePasswordRisk('hello123', undefined));

    expect(result.current.score).toBeGreaterThanOrEqual(0);
    expect(result.current.score).toBeLessThanOrEqual(4);
  });

  it('returns score 0 for empty password', () => {
    const { result } = renderHook(() => usePasswordRisk(''));
    expect(result.current.score).toBe(0);
  });
});
