import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { accessibilityStyles } from '../styles/accessibilityStyles';
// Displays completion, accuracy, and performance details for preparedness tasks.
export default function PreparednessTasksSection({
  tasks,
  challengeProgress,
  tasksOpen,
  onToggleTasks,
  expandedTaskKey,
  onToggleTask,
  largeText,
  highContrast,
}) {
  return (
    <View style={[styles.card, highContrast && accessibilityStyles.highContrastCard]}>
      <Pressable
        style={styles.header}
        onPress={onToggleTasks}
        accessibilityRole="button"
        accessibilityLabel="Preparedness tasks"
        accessibilityHint={tasksOpen ? 'Collapse preparedness tasks' : 'Expand preparedness tasks'}
        accessibilityState={{ expanded: tasksOpen }}
      >
        <View style={styles.headerCopy}>
          <Text style={[styles.sectionTitle, largeText && accessibilityStyles.largeTextHeading]}>
            Preparedness tasks
          </Text>
          <Text style={styles.helperText}>
            {tasksOpen ? 'Tap a task to view its stats.' : 'Tap to open the task list.'}
          </Text>
        </View>
        <Text style={styles.toggle}>{tasksOpen ? '-' : '+'}</Text>
      </Pressable>

      {tasksOpen ? (
        <View style={styles.taskList}>
          {tasks.map((task) => {
            const expanded = expandedTaskKey === task.key;
            const taskProgress = challengeProgress.taskProgress?.[task.key];
            return (
              <View key={task.key} style={styles.taskItem}>
                <Pressable
                  style={styles.taskHeader}
                  onPress={() => onToggleTask(task.key)}
                  accessibilityRole="button"
                  accessibilityLabel={task.title}
                  accessibilityHint={expanded ? 'Collapse task statistics' : 'Expand task statistics'}
                  accessibilityState={{ expanded }}
                >
                  <View style={styles.taskCopy}>
                    <Text style={[styles.taskTitle, largeText && accessibilityStyles.largeTextHeading]}>
                      {task.title}
                    </Text>
                    <Text style={[styles.taskDetail, largeText && accessibilityStyles.largeTextBody]}>
                      {task.detail}
                    </Text>
                  </View>
                  <Text style={styles.taskToggle}>{expanded ? '-' : '+'}</Text>
                </Pressable>

                {expanded ? (
                  <View style={styles.taskStats}>
                    <View style={styles.taskStat}>
                      <Text style={styles.taskStatLabel}>Best score</Text>
                      <Text style={styles.taskStatValue}>{taskProgress?.bestScore || 0} AP</Text>
                    </View>
                    <View style={styles.taskStat}>
                      <Text style={styles.taskStatLabel}>Accuracy</Text>
                      <Text style={styles.taskStatValue}>{taskProgress?.averageAccuracy || 0}%</Text>
                    </View>
                    <View style={styles.taskStat}>
                      <Text style={styles.taskStatLabel}>Times performed</Text>
                      <Text style={styles.taskStatValue}>{taskProgress?.attempts || 0}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    color: '#171717',
    fontSize: 17,
    fontWeight: '700',
  },
  helperText: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
  toggle: {
    color: '#171717',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
  taskList: {
    gap: 10,
  },
  taskItem: {
    backgroundColor: '#f5f5f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 14,
    gap: 10,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  taskCopy: {
    flex: 1,
    gap: 3,
  },
  taskTitle: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
  taskDetail: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
  taskToggle: {
    color: '#171717',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
  },
  taskStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskStat: {
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  taskStatLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  taskStatValue: {
    color: '#171717',
    fontSize: 16,
    fontWeight: '700',
  },
});
