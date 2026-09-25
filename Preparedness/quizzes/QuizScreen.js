import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { recordPreparednessAttempt } from '../../storage/appState';
import { accessibilityStyles } from '../../styles/accessibilityStyles';
import { commonStyles } from '../../styles/Styles';
import { getQuizById } from './quizCatalog';
import QuizFeedbackScreen from './QuizFeedbackScreen';
import useAccessibilitySettings from '../../hooks/useAccessibilitySettings';

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function prepareQuestions(questions) {
  return shuffle(questions).map((question) => ({
    ...question,
    answers: shuffle(question.answers),
  }));
}

export default function QuizScreen({ route, navigation }) {
  const quiz = getQuizById(route.params?.quizId);
  const [questions, setQuestions] = useState(() => prepareQuestions(quiz.questions));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [saved, setSaved] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const settings = useAccessibilitySettings();

  useEffect(() => {
    navigation.setOptions({ title: quiz.title });
  }, [navigation, quiz.title]);

  const question = questions[questionIndex];
  const isCorrect = submitted && selectedAnswerId === question.correctAnswerId;
  const isLastQuestion = questionIndex === questions.length - 1;
  const progressLabel = `${questionIndex + 1} of ${questions.length}`;
  const primaryActionLabel = !submitted ? 'Submit answer' : isLastQuestion ? 'Finish quiz' : 'Next';

  const feedbackText = useMemo(() => {
    if (!submitted) {
      return '';
    }
    return isCorrect
      ? 'Correct'
      : `Not quite. The correct answer is ${question.answers.find((answer) => answer.id === question.correctAnswerId)?.text}`;
  }, [isCorrect, question, submitted]);

  if (showFeedback) {
    return (
      <QuizFeedbackScreen
        quiz={quiz}
        questions={questions}
        answeredQuestions={answeredQuestions}
        score={score}
        largeText={settings.largeText}
        highContrast={settings.highContrast}
        onReturn={() => navigation.replace('Quizzes')}
      />
    );
  }

  const submitAttempt = async (finalScore) => {
    if (saved) {
      return;
    }
    setSaved(true);
    await recordPreparednessAttempt(`quiz-${quiz.id}`, {
      type: 'quiz',
      activityTitle: quiz.title,
      score: finalScore * 10,
      accuracy: Math.round((finalScore / questions.length) * 100),
    });
  };

  const handlePrimaryAction = async () => {
    if (!submitted) {
      if (!selectedAnswerId) {
        return;
      }
      const answeredCorrectly = selectedAnswerId === question.correctAnswerId;
      const nextScore = score + (answeredCorrectly ? 1 : 0);
      setScore(nextScore);
      setSubmitted(true);
      setAnsweredQuestions((previousAnswers) => [
        ...previousAnswers,
        {
          questionId: question.id,
          question: question.question,
          selectedAnswer: question.answers.find((answer) => answer.id === selectedAnswerId)?.text,
          correct: answeredCorrectly,
          correctAnswer: question.answers.find((answer) => answer.id === question.correctAnswerId)?.text,
          explanation: question.explanation,
        },
      ]);
      if (isLastQuestion) {
        await submitAttempt(nextScore);
      }
      return;
    }

    if (isLastQuestion) {
      setShowFeedback(true);
      return;
    }

    setQuestionIndex((previousQuestionIndex) => previousQuestionIndex + 1);
    setSelectedAnswerId(null);
    setSubmitted(false);
  };

  const restartQuiz = () => {
    setQuestions(prepareQuestions(quiz.questions));
    setQuestionIndex(0);
    setSelectedAnswerId(null);
    setSubmitted(false);
    setScore(0);
    setSaved(false);
    setAnsweredQuestions([]);
    setShowFeedback(false);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, settings.highContrast && accessibilityStyles.highContrastBackground]}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.introCard, settings.highContrast && accessibilityStyles.highContrastPrimary]}>
          <View style={styles.introHeader}>
            <Text style={[styles.eyebrow, settings.largeText && accessibilityStyles.largeTextSmall]}>
              Preparedness quiz
            </Text>
            <Text style={[styles.scorePill, settings.largeText && accessibilityStyles.largeTextSmall]}>
              {score * 10} AP
            </Text>
          </View>
          <Text style={[styles.title, settings.largeText && accessibilityStyles.largeTextTitle]}>{quiz.title}</Text>
          <View style={styles.progressHeader}>
            <Text style={[styles.progress, settings.largeText && accessibilityStyles.largeTextSmall]}>
              {progressLabel}
            </Text>
            <Text style={[styles.progressHint, settings.largeText && accessibilityStyles.largeTextSmall]}>
              Choose the safest answer
            </Text>
          </View>
          <View style={styles.progressTrack}>
            {questions.map((item, index) => (
              <View
                key={item.id}
                style={[styles.progressSegment, index <= questionIndex && styles.progressSegmentActive]}
              />
            ))}
          </View>
        </View>

        <View style={[styles.questionCard, settings.highContrast && accessibilityStyles.highContrastCard]}>
          <Text
            style={[styles.question, settings.largeText && accessibilityStyles.largeTextTitle]}
            accessibilityRole="header"
          >
            {question.question}
          </Text>
          <View style={styles.answers}>
            {question.answers.map((answer) => {
              const selected = selectedAnswerId === answer.id;
              const correct = submitted && answer.id === question.correctAnswerId;
              const incorrect = submitted && selected && !correct;
              return (
                <Pressable
                  key={answer.id}
                  disabled={submitted}
                  onPress={() => setSelectedAnswerId(answer.id)}
                  accessibilityRole="radio"
                  accessibilityLabel={answer.text}
                  accessibilityHint={submitted ? 'Answer already submitted' : 'Double tap to select this answer'}
                  accessibilityState={{ selected }}
                  style={[
                    styles.answer,
                    selected && styles.answerSelected,
                    correct && styles.answerCorrect,
                    incorrect && styles.answerIncorrect,
                    settings.highContrast && accessibilityStyles.highContrastSecondary,
                  ]}
                >
                  <Text style={styles.answerLetter}>{answer.id.toUpperCase()}</Text>
                  <Text style={[styles.answerText, settings.largeText && accessibilityStyles.largeTextBody]}>
                    {answer.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {submitted ? (
            <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
              <Text style={[styles.feedbackTitle, settings.largeText && accessibilityStyles.largeTextHeading]}>
                {feedbackText}
              </Text>
              <Text style={[styles.feedbackDetail, settings.largeText && accessibilityStyles.largeTextBody]}>
                {question.explanation}
              </Text>
            </View>
          ) : null}

          <Pressable
            disabled={!submitted && !selectedAnswerId}
            onPress={handlePrimaryAction}
            accessibilityRole="button"
            accessibilityLabel={submitted ? (isLastQuestion ? 'Finish quiz' : 'Next question') : 'Submit answer'}
            accessibilityHint={!submitted && !selectedAnswerId ? 'Select an answer first' : undefined}
            style={[
              styles.primaryButton,
              settings.highContrast && accessibilityStyles.highContrastPrimary,
              !submitted && !selectedAnswerId && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={[styles.primaryButtonText, settings.largeText && accessibilityStyles.largeTextButton]}>
              {primaryActionLabel}
            </Text>
          </Pressable>
        </View>

        {submitted && isLastQuestion ? (
          <View style={[styles.resultCard, settings.highContrast && accessibilityStyles.highContrastCard]}>
            <Text style={[styles.resultLabel, settings.largeText && accessibilityStyles.largeTextSmall]}>
              Quiz result
            </Text>
            <Text style={[styles.resultScore, settings.largeText && accessibilityStyles.largeTextValue]}>
              {score} / {questions.length}
            </Text>
            <Text style={[styles.resultDetail, settings.largeText && accessibilityStyles.largeTextBody]}>
              Your result and accuracy have been saved to preparedness progress.
            </Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={restartQuiz}
              accessibilityRole="button"
              accessibilityLabel="Try the quiz again"
            >
              <Text style={[styles.secondaryButtonText, settings.largeText && accessibilityStyles.largeTextButton]}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  safeArea: { flex: 1, backgroundColor: '#f5f5f2' },
  content: { padding: 18, gap: 14 },
  introCard: { backgroundColor: '#171717', borderRadius: 8, padding: 18, gap: 6 },
  introHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  eyebrow: { color: '#c5d0c5', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  scorePill: {
    color: '#171717',
    backgroundColor: '#c5d0c5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '800',
  },
  title: { color: '#ffffff', fontSize: 26, fontWeight: '700' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  progress: { color: '#d4d4d4', fontSize: 14, fontWeight: '700' },
  progressHint: { color: '#9ca39d', fontSize: 12 },
  progressTrack: { flexDirection: 'row', gap: 5, marginTop: 6 },
  progressSegment: { flex: 1, height: 5, borderRadius: 999, backgroundColor: '#454a46' },
  progressSegmentActive: { backgroundColor: '#c5d0c5' },
  questionCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 14,
  },
  question: { color: '#171717', fontSize: 21, lineHeight: 28, fontWeight: '700' },
  answers: { gap: 10 },
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    padding: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8d2',
    backgroundColor: '#ffffff',
  },
  answerSelected: { borderColor: '#171717', backgroundColor: '#efeee8' },
  answerCorrect: { borderColor: '#4d7c5a', backgroundColor: '#eaf4ec' },
  answerIncorrect: { borderColor: '#b4534b', backgroundColor: '#fcebea' },
  answerLetter: { color: '#5f6b63', fontSize: 13, fontWeight: '800', width: 18 },
  answerText: { flex: 1, color: '#292929', fontSize: 15, lineHeight: 20 },
  feedback: { borderRadius: 8, borderWidth: 1, padding: 13, gap: 5 },
  feedbackCorrect: { borderColor: '#9cc5a3', backgroundColor: '#eaf4ec' },
  feedbackIncorrect: { borderColor: '#e0aaa5', backgroundColor: '#fcebea' },
  feedbackTitle: { color: '#171717', fontSize: 15, fontWeight: '800' },
  feedbackDetail: { color: '#525252', fontSize: 14, lineHeight: 20 },
  primaryButton: { backgroundColor: '#171717', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  resultCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 7,
  },
  resultLabel: { color: '#5f6b63', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  resultScore: { color: '#171717', fontSize: 32, fontWeight: '700' },
  resultDetail: { color: '#525252', fontSize: 14, lineHeight: 20 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#cfcfc7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  secondaryButtonText: { color: '#171717', fontSize: 14, fontWeight: '700' },
});
