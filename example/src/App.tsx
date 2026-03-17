import { useState } from 'react';
import { Text, View, StyleSheet, TextInput, ScrollView } from 'react-native';
import {
  usePasswordRisk,
  PasswordMeter,
  type PasswordScore,
} from 'react-native-password-intelligence';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCORE_LABELS: readonly string[] = [
  'Very Weak',
  'Weak',
  'Fair',
  'Good',
  'Strong',
];

const SCORE_COLORS: readonly string[] = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#22c55e',
];

const getLabel = (score: PasswordScore): string => SCORE_LABELS[score] ?? '';
const getColor = (score: PasswordScore): string => SCORE_COLORS[score] ?? '';

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [password, setPassword] = useState('');
  const { score, crackTimeDisplay, feedback } = usePasswordRisk(password);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔐 Password Intelligence</Text>
      <Text style={styles.subtitle}>Turkish-aware security analysis</Text>

      <TextInput
        style={styles.input}
        placeholder="Try 'mehmet', 'askim123', 'qweasd'…"
        placeholderTextColor="#64748b"
        secureTextEntry={false}
        onChangeText={setPassword}
        value={password}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.card}>
        <Text style={styles.label}>Security Strength</Text>

        <PasswordMeter password={password} />

        <View style={styles.statsRow}>
          <Text style={[styles.scoreLabel, { color: getColor(score) }]}>
            {getLabel(score)} ({score}/4)
          </Text>
          <Text style={styles.statsLabel}>⏱ {crackTimeDisplay || 'N/A'}</Text>
        </View>

        {feedback.warning ? (
          <Text style={styles.warning}>⚠️ {feedback.warning}</Text>
        ) : null}

        {feedback.suggestions.map((suggestion, index) => (
          <Text key={index} style={styles.suggestion}>
            • {suggestion}
          </Text>
        ))}
      </View>

      {/* Pattern hint card */}
      <View style={styles.hintCard}>
        <Text style={styles.hintTitle}>🇹🇷 Try These Turkish Patterns</Text>
        <Text style={styles.hintText}>mehmet · galatasaray1905 · askim123</Text>
        <Text style={styles.hintText}>qweasd · 34istanbul · bismillah</Text>
        <Text style={styles.hintText}>fenerbahce1907 · canim · ataturk</Text>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#f8fafc',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#475569',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  warning: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 5,
  },
  suggestion: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 4,
  },
  hintCard: {
    marginTop: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hintTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  hintText: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
});
