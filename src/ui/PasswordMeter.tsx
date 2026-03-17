import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, type ViewStyle } from 'react-native';

import { usePasswordRisk } from '../hooks/usePasswordRisk';
import type { PasswordScore } from '../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Discriminated union: provide either `password` (auto-analyzed) OR `score`
 * (pre-computed). Supplying neither is a type error.
 */
type PasswordMeterProps = (
  | { password: string; score?: never }
  | { score: PasswordScore; password?: never }
) & {
  /** Custom wrapper style. */
  style?: ViewStyle;
  /** Height of the progress bar in pixels. @default 6 */
  barHeight?: number;
};

// ---------------------------------------------------------------------------
// Color scale (0-4)
// ---------------------------------------------------------------------------

const SCORE_COLORS: readonly string[] = [
  '#ef4444', // 0 — Very Weak (red)
  '#f97316', // 1 — Weak (orange)
  '#eab308', // 2 — Fair (yellow)
  '#84cc16', // 3 — Good (lime)
  '#22c55e', // 4 — Strong (green)
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PasswordMeter = ({
  score: providedScore,
  password,
  style,
  barHeight = 6,
}: PasswordMeterProps) => {
  // When `score` is provided directly, we still call the hook with an empty
  // string. The hook's useMemo will cache the empty-string result so there
  // is effectively zero overhead after the first render.
  const { score: computedScore } = usePasswordRisk(
    providedScore !== undefined ? '' : (password ?? '')
  );

  const score: PasswordScore =
    providedScore !== undefined ? providedScore : computedScore;

  // --- Animation refs ---
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const animatedColor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedWidth, {
        toValue: (score / 4) * 100,
        duration: 300,
        useNativeDriver: false, // width% cannot use native driver
      }),
      Animated.timing(animatedColor, {
        toValue: score,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [score, animatedWidth, animatedColor]);

  const backgroundColor = animatedColor.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: SCORE_COLORS as unknown as string[],
  });

  return (
    <View style={[styles.container, { height: barHeight }, style]}>
      <Animated.View
        style={[
          styles.bar,
          {
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor,
          },
        ]}
      />
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#334155',
    borderRadius: 100,
    overflow: 'hidden',
    marginVertical: 10,
  },
  bar: {
    height: '100%',
    borderRadius: 100,
  },
});
