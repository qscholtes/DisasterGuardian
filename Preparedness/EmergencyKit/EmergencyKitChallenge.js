import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { loadPreparednessProgress, recordPreparednessAttempt } from '../../storage/appState';
import { accessibilityStyles } from '../../styles/accessibilityStyles';
import useAccessibilitySettings from '../../hooks/useAccessibilitySettings';
import EmergencyKitIntro from './EmergencyKitIntro';
import {
  BACKPACK_CAPACITY,
  TASK_ID,
  challengeReducer,
  formatTime,
  getBadge,
  getScore,
  initialState,
} from './EmergencyKitChallenge.logic';

function RoomItem({ item, disabled, onPack, onDrop, onDragStart, largeText, highContrast }) {
  const pan = useMemo(() => new Animated.ValueXY(), []);
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: () => onDragStart(item.id),
        onPanResponderMove: (_, gesture) => pan.setValue({ x: gesture.dx, y: gesture.dy }),
        onPanResponderRelease: (_, gesture) => {
          onDrop(item.id, gesture.moveX, gesture.moveY);
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
        },
        onPanResponderTerminate: () => onDrop(item.id, null, null),
      }),
    [disabled, item.id, onDragStart, onDrop, pan],
  );

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.roomItem,
        highContrast && accessibilityStyles.highContrastSecondary,
        {
          left: `${item.position[0]}%`,
          top: `${item.position[1]}%`,
          opacity: disabled ? 0.55 : 1,
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <Pressable
        style={styles.roomItemButton}
        onPress={() => onPack(item.id)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}. ${item.essential ? 'Essential emergency-kit item.' : 'Not an essential emergency-kit item.'}`}
        accessibilityHint="Double tap to pack this item"
      >
        <MaterialCommunityIcons
          name={item.iconName}
          size={22}
          color={item.essential ? '#416b4d' : '#687078'}
          accessible={false}
        />
        <Text style={[styles.roomItemLabel, largeText && styles.largeRoomItemLabel]} numberOfLines={2}>
          {item.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function EmergencyKitChallenge() {
  const [state, dispatch] = useReducer(challengeReducer, initialState);
  const [progress, setProgress] = useState(null);
  const [dropZone, setDropZone] = useState(null);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const backpackRef = useRef(null);
  const score = getScore(state.packedItems, state.secondsLeft);
  const finalScore = getScore(state.selectedItems, state.secondsLeft);
  const correctCount = state.selectedItems.filter((item) => item.essential).length;
  const incorrectCount = state.selectedItems.length - correctCount;
  const accuracy = state.selectedItems.length ? Math.round((correctCount / state.selectedItems.length) * 100) : 0;
  const [badgeName, badgeDescription] = getBadge(finalScore);

  useEffect(() => {
    loadPreparednessProgress()
      .then(setProgress)
      .catch(() => setProgress(null));
  }, []);

  const { largeText, highContrast } = useAccessibilitySettings();

  useEffect(() => {
    if (state.phase !== 'game' || state.submitted) {
      return undefined;
    }
    if (state.secondsLeft === 0) {
      dispatch({ type: 'SUBMIT' });
      return undefined;
    }
    const timer = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(timer);
  }, [state.phase, state.secondsLeft, state.submitted]);

  useEffect(() => {
    if (state.phase !== 'results' || !state.submitted) {
      return;
    }

    const saveProgress = async () => {
      const previous = await loadPreparednessProgress();

      const totalAttempts = previous.totalAttempts + 1;
      const totalAccuracy = previous.averageAccuracy * previous.totalAttempts + accuracy;
      const progressPatch = {
        totalAp: previous.totalAp + finalScore,
        totalAttempts,
        bestScore: Math.max(previous.bestScore, finalScore),
        averageAccuracy: Math.round(totalAccuracy / totalAttempts),
        badgesEarned: previous.badgesEarned,
      };

      const savedProgress = await recordPreparednessAttempt(TASK_ID, {
        type: 'challenge',
        activityTitle: 'Emergency kit challenge',
        score: finalScore,
        accuracy,
        progressPatch,
      });
      setProgress(savedProgress);
    };

    saveProgress().catch(() => {});
  }, [accuracy, badgeName, finalScore, state.phase, state.submitted]);

  const refreshDropZone = () => {
    requestAnimationFrame(() => {
      backpackRef.current?.measureInWindow((x, y, width, height) => setDropZone({ x, y, width, height }));
    });
  };

  const handleDrop = (id, x, y) => {
    setDraggingItemId(null);
    if (x == null || y == null || !dropZone) return;
    const inside =
      x >= dropZone.x && x <= dropZone.x + dropZone.width && y >= dropZone.y && y <= dropZone.y + dropZone.height;
    if (inside) dispatch({ type: 'PACK_ITEM', id });
  };

  if (state.phase === 'intro') {
    return (
      <EmergencyKitIntro
        progress={progress}
        largeText={largeText}
        highContrast={highContrast}
        onStart={() => dispatch({ type: 'START' })}
      />
    );
  }

  if (state.phase === 'results') {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.resultsPanel}>
          <Text style={styles.introEyebrow}>CHALLENGE COMPLETE</Text>
          <Text style={styles.title}>Your kit is packed</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreLabel}>Final Score</Text>
            <Text style={styles.finalScore}>{finalScore} AP</Text>
          </View>

          <View style={styles.statsGrid}>
            <Stat label="Correct Items" value={correctCount} />
            <Stat label="Incorrect Items" value={incorrectCount} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Time Remaining" value={`${state.secondsLeft} sec`} />
          </View>

          <View style={styles.badgePanel}>
            <Text style={styles.badgeLabel}>Badge Earned</Text>
            <Text style={styles.badgeName}>{badgeName}</Text>
            <Text style={styles.badgeDescription}>{badgeDescription}</Text>
          </View>

          {progress ? (
            <View style={styles.progressSummary}>
              <Text style={styles.sectionTitle}>Profile Progress</Text>
              <Text style={styles.summaryText}>Total AP: {progress.totalAp}</Text>
              <Text style={styles.summaryText}>Preparedness Attempts: {progress.totalAttempts}</Text>
              <Text style={styles.summaryText}>Best Score: {progress.bestScore}</Text>
              <Text style={styles.summaryText}>Average Accuracy: {progress.averageAccuracy}%</Text>
              <Text style={styles.summaryText}>Badge progression is calculated in Profile.</Text>
            </View>
          ) : null}

          {state.showFeedback ? (
            <View style={styles.feedbackBox}>
              <View style={styles.feedbackHeader}>
                <View style={styles.feedbackTitleGroup}>
                  <Text style={styles.sectionTitle}>Item Feedback</Text>
                  <Text style={styles.feedbackSubtitle}>Why each packed item helped or hurt readiness.</Text>
                </View>
                <Pressable style={styles.closeFeedbackButton} onPress={() => dispatch({ type: 'CLOSE_FEEDBACK' })}>
                  <Text style={styles.closeFeedbackText}>Close</Text>
                </Pressable>
              </View>

              {state.selectedItems.map((item) => (
                <View key={item.id} style={styles.feedbackCard}>
                  <View
                    style={[
                      styles.feedbackIcon,
                      item.essential ? styles.feedbackIconCorrect : styles.feedbackIconIncorrect,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.iconName}
                      size={24}
                      color={item.essential ? '#416b4d' : '#946b2d'}
                      accessible={false}
                    />
                  </View>
                  <View style={styles.feedbackCopy}>
                    <Text style={styles.feedbackName}>{item.name}</Text>
                    <Text
                      style={[
                        styles.feedbackStatus,
                        item.essential ? styles.feedbackStatusCorrect : styles.feedbackStatusIncorrect,
                      ]}
                    >
                      {item.essential ? 'Useful choice' : 'Not recommended'}
                    </Text>
                    <Text style={styles.feedbackExplanation}>{item.explanation}</Text>
                  </View>
                </View>
              ))}

              {!state.selectedItems.length ? (
                <Text style={styles.emptyText}>
                  No items were packed. Try again and prioritize survival basics first.
                </Text>
              ) : null}
            </View>
          ) : null}

          {state.showFeedback ? null : (
            <Pressable style={styles.primaryButton} onPress={() => dispatch({ type: 'FEEDBACK' })}>
              <Text style={styles.primaryButtonText}>View Feedback</Text>
            </Pressable>
          )}
          <Pressable style={styles.secondaryButton} onPress={() => dispatch({ type: 'START' })}>
            <Text style={styles.secondaryButtonText}>Try Again</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.gameScreen, highContrast && accessibilityStyles.highContrastBackground]}>
      <View style={styles.topBar}>
        <View style={[styles.pill, highContrast && accessibilityStyles.highContrastCard]}>
          <Text style={[styles.pillLabel, largeText && accessibilityStyles.largeTextSmall]}>Capacity</Text>
          <Text style={[styles.pillValue, largeText && accessibilityStyles.largeTextHeading]}>
            {state.packedItems.length} / {BACKPACK_CAPACITY}
          </Text>
        </View>
        <View style={[styles.pill, styles.timerPill, highContrast && accessibilityStyles.highContrastCard]}>
          <Text style={[styles.pillLabel, largeText && accessibilityStyles.largeTextSmall]}>Timer</Text>
          <Text style={[styles.timerText, largeText && accessibilityStyles.largeTextHeading]}>
            {formatTime(state.secondsLeft)}
          </Text>
        </View>
        <View style={[styles.pill, highContrast && accessibilityStyles.highContrastCard]}>
          <Text style={[styles.pillLabel, largeText && accessibilityStyles.largeTextSmall]}>AP</Text>
          <Text style={[styles.pillValue, largeText && accessibilityStyles.largeTextHeading]}>{score}</Text>
        </View>
      </View>

      <View style={styles.playArea}>
        <View style={[styles.roomPanel, highContrast && accessibilityStyles.highContrastCard]}>
          <RoomFurniture />
          {state.availableItems.map((item) => (
            <RoomItem
              key={item.id}
              item={item}
              disabled={state.submitted}
              onPack={(id) => dispatch({ type: 'PACK_ITEM', id })}
              onDrop={handleDrop}
              onDragStart={setDraggingItemId}
              largeText={largeText}
              highContrast={highContrast}
            />
          ))}
        </View>

        <View style={styles.backpackPanel} onLayout={refreshDropZone}>
          <View
            ref={backpackRef}
            collapsable={false}
            onLayout={refreshDropZone}
            style={[
              styles.backpackDropZone,
              highContrast && accessibilityStyles.highContrastCard,
              draggingItemId && styles.backpackDropZoneActive,
            ]}
          >
            <MaterialCommunityIcons name="bag-personal-outline" size={34} color="#416b4d" accessible={false} />
            <Text style={[styles.backpackText, largeText && accessibilityStyles.largeTextHeading]}>
              Pack your supplies
            </Text>
            <Text style={[styles.backpackHint, largeText && accessibilityStyles.largeTextSmall]}>
              Drag items here or tap an item to pack it
            </Text>
            <Text style={[styles.capacityText, largeText && accessibilityStyles.largeTextSmall]}>
              Backpack Capacity: {state.packedItems.length} / {BACKPACK_CAPACITY}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inventoryList}>
            {state.packedItems.length ? (
              state.packedItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => dispatch({ type: 'REMOVE_ITEM', id: item.id })}
                  style={[styles.inventoryItem, highContrast && accessibilityStyles.highContrastSecondary]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}. Packed item.`}
                  accessibilityHint="Double tap to remove this item"
                >
                  <MaterialCommunityIcons name={item.iconName} size={22} color="#416b4d" accessible={false} />
                  <View style={styles.inventoryCopy}>
                    <Text
                      style={[styles.inventoryName, largeText && accessibilityStyles.largeTextSmall]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.inventoryHint, largeText && accessibilityStyles.largeTextSmall]}>
                      Tap to remove
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text
                style={[
                  styles.emptyInventory,
                  highContrast && accessibilityStyles.highContrastCard,
                  largeText && accessibilityStyles.largeTextBody,
                ]}
              >
                Drag or tap supplies to pack them.
              </Text>
            )}
          </ScrollView>

          <Pressable
            style={[styles.submitButton, highContrast && accessibilityStyles.highContrastPrimary]}
            onPress={() => dispatch({ type: 'SUBMIT' })}
          >
            <Text style={[styles.submitButtonText, largeText && accessibilityStyles.largeTextButton]}>Submit Pack</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[styles.tipText, largeText && accessibilityStyles.largeTextSmall]}>
        Tip: prioritize water, first aid, light, communication, food, warmth, hygiene, and medicine.
      </Text>
    </SafeAreaView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RoomFurniture() {
  return (
    <>
      <View style={styles.window} />
      <View style={styles.shelf} />
      <View style={styles.table} />
      <View style={styles.sofa} />
      <View style={styles.rug} />
      <View style={styles.floorLamp} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f2',
  },
  title: {
    color: '#171717',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0,
  },
  primaryButton: {
    backgroundColor: '#171717',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fafaf9',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderColor: '#cfcfc7',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#fbfbf9',
  },
  secondaryButtonText: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
  gameScreen: {
    flex: 1,
    backgroundColor: '#f5f5f2',
    padding: 18,
  },
  topBar: {
    width: '100%',
    height: 64,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    flex: 0,
    width: '31%',
    backgroundColor: '#fbfbf9',
    borderColor: '#dfdfd8',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerPill: {
    backgroundColor: '#fbfbf9',
    borderColor: '#a7b2a9',
    borderWidth: 1.5,
  },
  pillLabel: {
    color: '#737373',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0,
    textAlign: 'center',
    flexShrink: 1,
  },
  pillValue: {
    color: '#171717',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
    flexShrink: 1,
  },
  timerText: {
    color: '#171717',
    fontSize: 20,
    fontWeight: '700',
  },
  playArea: {
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  roomPanel: {
    flex: 1,
    minHeight: 300,
    backgroundColor: '#ebe9e3',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d4d1c8',
  },
  backpackPanel: {
    gap: 12,
    width: '100%',
  },
  roomItem: {
    position: 'absolute',
    width: 68,
    minHeight: 58,
    borderRadius: 10,
    backgroundColor: '#f7f7f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d6d5cf',
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  roomItemButton: {
    width: '100%',
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 5,
    gap: 2,
  },
  roomItemLabel: {
    color: '#2f2f2f',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  largeRoomItemLabel: {
    fontSize: 11,
    lineHeight: 13,
  },
  backpackDropZone: {
    minHeight: 104,
    backgroundColor: '#fbfbf9',
    borderRadius: 10,
    borderColor: '#d6d5cf',
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    width: '100%',
  },
  backpackDropZoneActive: {
    backgroundColor: '#eef6ef',
    borderColor: '#416b4d',
    borderWidth: 2,
  },
  backpackText: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
  backpackHint: {
    color: '#5f6b63',
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  capacityText: {
    color: '#737373',
    marginTop: 4,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  inventoryList: {
    minHeight: 58,
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 1,
  },
  emptyInventory: {
    color: '#737373',
    textAlign: 'center',
    padding: 14,
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    width: '100%',
    textAlignVertical: 'center',
  },
  inventoryItem: {
    minHeight: 58,
    minWidth: 142,
    backgroundColor: '#fbfbf9',
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#dfdfd8',
  },
  inventoryCopy: {
    flex: 1,
    minWidth: 0,
  },
  inventoryName: {
    color: '#2f2f2f',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
  inventoryHint: {
    color: '#5f5f5f',
    fontSize: 12,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#171717',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'center',
    width: '72%',
    minHeight: 48,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fafaf9',
    fontWeight: '700',
    fontSize: 14,
  },
  tipText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    paddingTop: 10,
  },
  window: {
    position: 'absolute',
    left: '8%',
    top: '8%',
    width: '24%',
    height: '20%',
    backgroundColor: '#c7e4eb',
    borderColor: '#f8fafc',
    borderWidth: 6,
  },
  shelf: {
    position: 'absolute',
    right: '4%',
    top: '8%',
    width: '30%',
    height: 18,
    backgroundColor: '#806247',
    borderRadius: 4,
  },
  table: {
    position: 'absolute',
    left: '34%',
    top: '43%',
    width: '28%',
    height: '18%',
    backgroundColor: '#927052',
    borderRadius: 8,
  },
  sofa: {
    position: 'absolute',
    left: '5%',
    bottom: '9%',
    width: '35%',
    height: '17%',
    backgroundColor: '#7a8499',
    borderRadius: 8,
  },
  rug: {
    position: 'absolute',
    right: '8%',
    bottom: '8%',
    width: '38%',
    height: '22%',
    backgroundColor: '#c49a63',
    borderRadius: 8,
    opacity: 0.8,
  },
  floorLamp: {
    position: 'absolute',
    right: '10%',
    top: '28%',
    width: 14,
    height: '30%',
    backgroundColor: '#596174',
    borderRadius: 7,
  },
  resultsPanel: {
    padding: 18,
    backgroundColor: '#f5f5f2',
    minHeight: '100%',
  },
  scoreBadge: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dfdfd8',
  },
  scoreLabel: {
    color: '#5f6b63',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  finalScore: {
    color: '#171717',
    fontSize: 32,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dfdfd8',
  },
  statValue: {
    color: '#171717',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
  },
  badgePanel: {
    marginTop: 12,
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dfdfd8',
  },
  badgeLabel: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  badgeName: {
    color: '#171717',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 6,
  },
  badgeDescription: {
    color: '#525252',
    fontSize: 15,
    marginTop: 6,
  },
  progressSummary: {
    marginTop: 12,
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dfdfd8',
  },
  sectionTitle: {
    color: '#171717',
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 8,
  },
  summaryText: {
    color: '#525252',
    fontSize: 15,
    marginTop: 4,
  },
  feedbackBox: {
    marginTop: 14,
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 14,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  feedbackTitleGroup: {
    flex: 1,
  },
  feedbackSubtitle: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  closeFeedbackButton: {
    borderColor: '#d4d4d4',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f2',
  },
  closeFeedbackText: {
    color: '#171717',
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#f9f9f8',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ecebe7',
  },
  feedbackIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackIconCorrect: {
    backgroundColor: '#eaf3eb',
  },
  feedbackIconIncorrect: {
    backgroundColor: '#fbf3e4',
  },
  feedbackStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  feedbackStatusCorrect: {
    color: '#416b4d',
  },
  feedbackStatusIncorrect: {
    color: '#946b2d',
  },
  feedbackCopy: {
    flex: 1,
  },
  feedbackName: {
    color: '#171717',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  feedbackExplanation: {
    color: '#525252',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    color: '#6b7280',
    paddingVertical: 16,
    textAlign: 'center',
  },
});
