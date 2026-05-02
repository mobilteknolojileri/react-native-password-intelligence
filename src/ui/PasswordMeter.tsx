import { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { usePasswordRisk } from '../hooks/usePasswordRisk';
import type { PasswordScore } from '../types';

/**
 * Discriminated union: provide either `password` (auto-analyzed) OR `score`
 * (pre-computed). Supplying neither is a type error. The `score` variant
 * intentionally bypasses the analyzer entirely so consumers who already have
 * a score (e.g., from a server) pay no zxcvbn initialization cost.
 */
export type PasswordMeterProps = (
  | {
      password: string;
      userInputs?: readonly (string | number)[];
      score?: never;
    }
  | { score: PasswordScore; password?: never; userInputs?: never }
) & {
  /** Custom wrapper style. */
  style?: StyleProp<ViewStyle>;
  /** Height of the progress bar in pixels. @default 6 */
  barHeight?: number;
};

const SCORE_COLORS = [
  '#ef4444', // 0 — Very Weak (red)
  '#f97316', // 1 — Weak (orange)
  '#eab308', // 2 — Fair (yellow)
  '#84cc16', // 3 — Good (lime)
  '#22c55e', // 4 — Strong (green)
] as const satisfies readonly string[];

type BarProps = {
  score: PasswordScore;
  style?: StyleProp<ViewStyle> | undefined;
  barHeight: number;
};

const PasswordMeterBar = ({ score, style, barHeight }: BarProps) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const animatedColor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedWidth, {
        toValue: (score / 4) * 100,
        duration: 300,
        useNativeDriver: false,
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
    outputRange: [...SCORE_COLORS],
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

type AnalyzedBarProps = {
  password: string;
  userInputs?: readonly (string | number)[] | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  barHeight: number;
};

const AnalyzedPasswordMeterBar = ({
  password,
  userInputs,
  style,
  barHeight,
}: AnalyzedBarProps) => {
  const { score } = usePasswordRisk(password, userInputs);
  return <PasswordMeterBar score={score} style={style} barHeight={barHeight} />;
};

export const PasswordMeter = (props: PasswordMeterProps) => {
  const barHeight = props.barHeight ?? 6;

  if ('score' in props && props.score !== undefined) {
    return (
      <PasswordMeterBar
        score={props.score}
        style={props.style}
        barHeight={barHeight}
      />
    );
  }

  return (
    <AnalyzedPasswordMeterBar
      password={props.password}
      userInputs={props.userInputs}
      style={props.style}
      barHeight={barHeight}
    />
  );
};

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
