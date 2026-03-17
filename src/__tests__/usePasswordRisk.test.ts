import { renderHook } from '@testing-library/react-native';
import { usePasswordRisk } from '../hooks/usePasswordRisk';

describe('usePasswordRisk', () => {
  it('returns score and feedback for a given password', () => {
    const { result } = renderHook(() => usePasswordRisk('password123'));

    expect(result.current.score).toBeDefined();
    expect(result.current.score).toBeLessThanOrEqual(2);
    expect(result.current.crackTimeDisplay).toBeDefined();
    expect(typeof result.current.crackTimeDisplay).toBe('string');
    expect(result.current.feedback).toBeDefined();
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

    expect(result.current).toBe(firstResult); // Reference equality
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
});
