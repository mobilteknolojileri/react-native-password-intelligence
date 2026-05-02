/**
 * PasswordMeter — render and behavioral tests.
 *
 * The component uses react-native's Animated API internally. We rely on
 * Jest's built-in RN mock and replace `analyzePassword` with a jest.fn so
 * we can assert on call patterns.
 */

import { render, act } from '@testing-library/react-native';
import { PasswordMeter } from '../ui/PasswordMeter';
import * as analyzerModule from '../core/analyzer';

const baseResult = {
  score: 2 as const,
  feedback: { warning: null, suggestions: [] },
  crackTimesDisplay: {
    onlineThrottling100PerHour: '1 month',
    onlineNoThrottling10PerSecond: '1 hour',
    offlineSlowHashing1e4PerSecond: '1 second',
    offlineFastHashing1e10PerSecond: 'less than a second',
  },
  crackTimesSeconds: {
    onlineThrottling100PerHour: 2_592_000,
    onlineNoThrottling10PerSecond: 3_600,
    offlineSlowHashing1e4PerSecond: 1,
    offlineFastHashing1e10PerSecond: 0.001,
  },
  guesses: 1e6,
  guessesLog10: 6,
  sequence: [],
  calcTime: 1,
  password: '',
};

jest.mock('../core/analyzer', () => ({
  analyzePassword: jest.fn(() => baseResult),
  addCustomDictionary: jest.fn(),
  clearCustomDictionary: jest.fn(),
}));

const mockedAnalyzePassword =
  analyzerModule.analyzePassword as unknown as jest.Mock;

describe('PasswordMeter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedAnalyzePassword.mockClear();
    mockedAnalyzePassword.mockReturnValue(baseResult);
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders without crashing when given a password prop', () => {
      const { toJSON } = render(<PasswordMeter password="test123" />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders without crashing when given a score prop', () => {
      const { toJSON } = render(<PasswordMeter score={3} />);
      expect(toJSON()).toBeTruthy();
    });

    it('accepts custom barHeight', () => {
      const { toJSON } = render(
        <PasswordMeter password="test" barHeight={12} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('accepts custom style', () => {
      const { toJSON } = render(
        <PasswordMeter password="test" style={{ marginTop: 20 }} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('accepts a StyleProp array (idiomatic RN style)', () => {
      const { toJSON } = render(
        <PasswordMeter
          password="test"
          style={[{ marginTop: 20 }, { borderRadius: 4 }]}
        />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders for every valid score 0..4', () => {
      for (const s of [0, 1, 2, 3, 4] as const) {
        const { toJSON } = render(<PasswordMeter score={s} />);
        expect(toJSON()).toBeTruthy();
      }
    });
  });

  describe('userInputs prop', () => {
    it('accepts userInputs prop alongside password', () => {
      const { toJSON } = render(
        <PasswordMeter
          password="mehmet1907"
          userInputs={['Mehmet', 'mehmet@example.com']}
        />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders correctly with empty userInputs', () => {
      const { toJSON } = render(
        <PasswordMeter password="test" userInputs={[]} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('forwards userInputs into the analyzer', () => {
      render(<PasswordMeter password="mehmet1907" userInputs={['Mehmet']} />);
      expect(mockedAnalyzePassword).toHaveBeenCalledWith('mehmet1907', [
        'Mehmet',
      ]);
    });
  });

  describe('score-mode shortcut (B5)', () => {
    it('does NOT call the analyzer when score is provided', () => {
      render(<PasswordMeter score={3} />);
      expect(mockedAnalyzePassword).not.toHaveBeenCalled();
    });

    it('does NOT call the analyzer for any precomputed score', () => {
      for (const s of [0, 1, 2, 3, 4] as const) {
        mockedAnalyzePassword.mockClear();
        render(<PasswordMeter score={s} />);
        expect(mockedAnalyzePassword).not.toHaveBeenCalled();
      }
    });

    it('calls the analyzer exactly once on a single password render', () => {
      render(<PasswordMeter password="test" />);
      expect(mockedAnalyzePassword).toHaveBeenCalledTimes(1);
    });
  });
});
