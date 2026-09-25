import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { quizCatalog } from '../Preparedness/quizzes/quizCatalog';
import { loadPreparednessProgress } from '../storage/appState';
import { accessibilityStyles } from '../styles/accessibilityStyles';
import { commonStyles } from '../styles/Styles';
import useAccessibilitySettings from '../hooks/useAccessibilitySettings';
import { ignoreError } from '../utils/ignoreError';

export default function QuizzesScreen({ navigation }) {
  const [progress, setProgress] = useState(null);
  const settings = useAccessibilitySettings();

  React.useEffect(() => {
    loadPreparednessProgress().then(setProgress).catch(ignoreError);
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, settings.highContrast && accessibilityStyles.highContrastBackground]}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, settings.highContrast && accessibilityStyles.highContrastCard]}>
          <Text style={[styles.eyebrow, settings.largeText && accessibilityStyles.largeTextSmall]}>Quizzes</Text>
          <Text style={[styles.title, settings.largeText && accessibilityStyles.largeTextTitle]}>
            Build confidence before an emergency
          </Text>
          <Text style={[styles.body, settings.largeText && accessibilityStyles.largeTextBody]}>
            Choose a disaster topic and test your knowledge. Questions and answer choices are randomized each time.
          </Text>
        </View>

        <View style={[styles.sectionCard, settings.highContrast && accessibilityStyles.highContrastCard]}>
          <Text style={[styles.sectionTitle, settings.largeText && accessibilityStyles.largeTextHeading]}>
            Choose a quiz
          </Text>
          {quizCatalog.map((quiz) => (
            <Pressable
              key={quiz.id}
              style={[styles.topicCard, settings.highContrast && accessibilityStyles.highContrastSecondary]}
              onPress={() => navigation.navigate('Quiz', { quizId: quiz.id })}
              accessibilityRole="button"
              accessibilityLabel={`Start ${quiz.title}`}
              accessibilityHint={`${quiz.questions.length} questions`}
            >
              <View style={styles.topicHeader}>
                <Text style={[styles.topicTitle, settings.largeText && accessibilityStyles.largeTextHeading]}>
                  {quiz.title}
                </Text>
                <Text style={[styles.startText, settings.largeText && accessibilityStyles.largeTextSmall]}>Start</Text>
              </View>
              <Text style={[styles.topicDetail, settings.largeText && accessibilityStyles.largeTextBody]}>
                {quiz.detail}
              </Text>
              <Text style={[styles.questionCount, settings.largeText && accessibilityStyles.largeTextSmall]}>
                {quiz.questions.length} questions
              </Text>
              <Text style={[styles.progressText, settings.largeText && accessibilityStyles.largeTextSmall]}>
                {progress?.taskProgress?.[`quiz-${quiz.id}`]?.attempts || 0} attempts ·{' '}
                {progress?.taskProgress?.[`quiz-${quiz.id}`]?.averageAccuracy || 0}% average accuracy
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.button} onPress={() => navigation.navigate('PrepareOverview')}>
          <Text style={[styles.buttonText, settings.largeText && accessibilityStyles.largeTextButton]}>
            Back to Prepare
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  content: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 56,
    gap: 14,
  },
  eyebrow: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#171717',
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    color: '#525252',
    fontSize: 14,
    lineHeight: 20,
  },
  topicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e1',
    padding: 14,
    gap: 6,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  topicTitle: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
  topicDetail: {
    color: '#525252',
    fontSize: 13,
    lineHeight: 18,
  },
  startText: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '700',
  },
  questionCount: {
    color: '#737373',
    fontSize: 12,
    fontWeight: '600',
  },
  progressText: {
    color: '#5f6b63',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#171717',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fafaf9',
    fontSize: 14,
    fontWeight: '700',
  },
});
