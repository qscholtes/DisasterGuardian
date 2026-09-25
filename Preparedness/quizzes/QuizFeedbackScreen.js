import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { accessibilityStyles } from '../../styles/accessibilityStyles';
import { commonStyles } from '../../styles/Styles';

export default function QuizFeedbackScreen({
  quiz,
  questions,
  answeredQuestions,
  score,
  onReturn,
  largeText,
  highContrast,
}) {
  const accuracy = Math.round((score / questions.length) * 100);

  return (
    <SafeAreaView
      style={[styles.safeArea, highContrast && accessibilityStyles.highContrastBackground]}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, highContrast && accessibilityStyles.highContrastPrimary]}>
          <Text style={[styles.eyebrow, largeText && accessibilityStyles.largeTextSmall]}>Quiz complete</Text>
          <Text style={[styles.title, largeText && accessibilityStyles.largeTextTitle]}>
            {accuracy >= 70 ? 'Strong response' : 'Keep building your readiness'}
          </Text>
          <Text style={[styles.body, largeText && accessibilityStyles.largeTextBody]}>
            Here is how you performed on {quiz.title.toLowerCase()}.
          </Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreBadge}>
              <Text style={[styles.scoreValue, largeText && accessibilityStyles.largeTextValue]}>
                {score}/{questions.length}
              </Text>
              <Text style={[styles.scoreLabel, largeText && accessibilityStyles.largeTextSmall]}>Correct</Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={[styles.scoreValue, largeText && accessibilityStyles.largeTextValue]}>{accuracy}%</Text>
              <Text style={[styles.scoreLabel, largeText && accessibilityStyles.largeTextSmall]}>Accuracy</Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={[styles.scoreValue, largeText && accessibilityStyles.largeTextValue]}>+{score * 10}</Text>
              <Text style={[styles.scoreLabel, largeText && accessibilityStyles.largeTextSmall]}>AP earned</Text>
            </View>
          </View>
        </View>

        <View style={[styles.reviewCard, highContrast && accessibilityStyles.highContrastCard]}>
          <View style={styles.reviewHeader}>
            <View>
              <Text style={[styles.sectionTitle, largeText && accessibilityStyles.largeTextHeading]}>
                Answer review
              </Text>
              <Text style={[styles.sectionDetail, largeText && accessibilityStyles.largeTextBody]}>
                You answered {score} question{score === 1 ? '' : 's'} correctly.
              </Text>
            </View>
            <Text style={styles.reviewCount}>
              {score}/{questions.length}
            </Text>
          </View>

          {answeredQuestions.map((answer, index) => (
            <View key={answer.questionId} style={[styles.questionRow, answer.correct && styles.questionRowCorrect]}>
              <View style={[styles.statusMark, answer.correct ? styles.statusMarkCorrect : styles.statusMarkIncorrect]}>
                <Text style={styles.statusMarkText}>{answer.correct ? 'OK' : '!'}</Text>
              </View>
              <View style={styles.questionCopy}>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                <Text style={[styles.questionText, largeText && accessibilityStyles.largeTextBody]}>
                  {answer.question}
                </Text>
                {answer.selectedAnswer ? (
                  <Text style={[styles.selectedAnswer, largeText && accessibilityStyles.largeTextBody]}>
                    Your answer: {answer.selectedAnswer}
                  </Text>
                ) : null}
                <Text style={[styles.answerResult, largeText && accessibilityStyles.largeTextBody]}>
                  {answer.correct ? 'Correct answer' : `Correct answer: ${answer.correctAnswer}`}
                </Text>
                {answer.explanation ? (
                  <Text style={[styles.explanation, largeText && accessibilityStyles.largeTextBody]}>
                    {answer.explanation}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.primaryButton, highContrast && accessibilityStyles.highContrastPrimary]}
          onPress={onReturn}
          accessibilityRole="button"
          accessibilityLabel="Return to quizzes"
        >
          <Text style={[styles.primaryButtonText, largeText && accessibilityStyles.largeTextButton]}>
            Return to quizzes
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  safeArea: { flex: 1, backgroundColor: '#f5f5f2' },
  content: { padding: 18, gap: 14 },
  heroCard: { backgroundColor: '#171717', borderRadius: 8, padding: 18, gap: 8 },
  eyebrow: { color: '#c5d0c5', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 27, lineHeight: 32, fontWeight: '700' },
  body: { color: '#d4d4d4', fontSize: 14, lineHeight: 20 },
  scoreRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  scoreBadge: { flex: 1, backgroundColor: '#2c302d', borderRadius: 8, padding: 10, gap: 3 },
  scoreValue: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  scoreLabel: { color: '#c5d0c5', fontSize: 11, fontWeight: '700' },
  reviewCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sectionTitle: { color: '#171717', fontSize: 17, fontWeight: '700' },
  sectionDetail: { color: '#6b7280', fontSize: 13, marginTop: 3 },
  reviewCount: { color: '#5f6b63', fontSize: 17, fontWeight: '800' },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e1',
    backgroundColor: '#ffffff',
  },
  questionRowCorrect: { borderColor: '#c8d9ca', backgroundColor: '#f4f8f3' },
  statusMark: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusMarkCorrect: { backgroundColor: '#4d7c5a' },
  statusMarkIncorrect: { backgroundColor: '#b4534b' },
  statusMarkText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  questionCopy: { flex: 1, gap: 3 },
  questionNumber: { color: '#6b7280', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  questionText: { color: '#292929', fontSize: 14, lineHeight: 19, fontWeight: '700' },
  answerResult: { color: '#5f6b63', fontSize: 12, lineHeight: 17 },
  selectedAnswer: { color: '#737373', fontSize: 12, lineHeight: 17 },
  explanation: { color: '#525252', fontSize: 12, lineHeight: 17, marginTop: 2 },
  primaryButton: { backgroundColor: '#171717', borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
