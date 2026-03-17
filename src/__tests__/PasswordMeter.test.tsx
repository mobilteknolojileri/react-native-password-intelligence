/**
 * PasswordMeter — render smoke tests.
 *
 * The component uses react-native's Animated API internally.
 * We rely on Jest's built-in RN mock (set up by react-native preset)
 * so we keep mock setup minimal.
 */

import { render, act } from '@testing-library/react-native';
import { PasswordMeter } from '../ui/PasswordMeter';

// Makes analyzePassword a no-op so tests are fast and isolated.
jest.mock('../core/analyzer', () => ({
  analyzePassword: () => ({
    score: 2,
    feedback: { warning: null, suggestions: [] },
    crackTimesDisplay: { onlineNoThrottling10PerSecond: '1 hour' },
    crackTimesSeconds: { onlineNoThrottling10PerSecond: 3600 },
    guesses: 1e6,
    guessesLog10: 6,
    sequence: [],
    calcTime: 1,
    password: '',
  }),
}));

describe('PasswordMeter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders without crashing when given a password prop', () => {
    const { toJSON } = render(<PasswordMeter password="test123" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders without crashing when given a score prop', () => {
    const { toJSON } = render(<PasswordMeter score={3} />);
    expect(toJSON()).toBeTruthy();
  });

  it('accepts custom barHeight', () => {
    const { toJSON } = render(<PasswordMeter password="test" barHeight={12} />);
    expect(toJSON()).toBeTruthy();
  });

  it('accepts custom style', () => {
    const { toJSON } = render(
      <PasswordMeter password="test" style={{ marginTop: 20 }} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
