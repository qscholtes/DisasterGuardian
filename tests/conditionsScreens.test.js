import React from 'react';
import { act, create } from 'react-test-renderer';
import { Alert, Switch } from 'react-native';
import HomeDashboardScreen from '../Dashboard/HomeDashboardScreen';
import AlertsScreen from '../Dashboard/AlertsScreen';
import SettingsDetailScreen from '../Profile/SettingsDetailScreen';
import {
  DEFAULT_APP_STATE,
  DEFAULT_PREPAREDNESS_PROGRESS,
  loadAppState,
  loadPreparednessProgress,
  loadChecklistState,
  updateAppState,
} from '../storage/appState';
import { emptyLocalConditions, loadLocalConditions } from '../utils/localConditions';
import { notifyNewWarnings, notifySimulatedWarning, syncPreparednessReminder } from '../utils/emergencyNotifications';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback) => require('react').useEffect(callback, [callback]),
}));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
jest.mock('../storage/appState', () => ({
  ...jest.requireActual('../storage/appState'),
  loadAppState: jest.fn(),
  loadPreparednessProgress: jest.fn(),
  loadChecklistState: jest.fn(),
  updateAppState: jest.fn(),
}));
jest.mock('../utils/localConditions', () => ({
  ...jest.requireActual('../utils/localConditions'),
  loadLocalConditions: jest.fn(),
}));
jest.mock('../utils/emergencyNotifications', () => ({
  notifyNewWarnings: jest.fn(),
  notifySimulatedWarning: jest.fn(),
  syncPreparednessReminder: jest.fn(),
}));

const navigation = { navigate: jest.fn() };
function snapshot(title) {
  return {
    ...emptyLocalConditions(),
    warnings: [{ id: 'real-warning', title, detail: title, severity: 'Severe', disasterType: 'flood' }],
    location: { latitude: 52.5, longitude: 13.4 },
    lastUpdated: new Date(),
  };
}
let tree;
let consoleError;
let alertSpy;
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  global.IS_REACT_ACT_ENVIRONMENT = true;
  // eslint-disable-next-line no-console -- Preserve unexpected renderer errors while filtering its deprecation notice.
  const originalError = console.error;
  consoleError = jest.spyOn(console, 'error').mockImplementation((message, ...args) => {
    // React 19 warns about the renderer used by the existing Jest/Expo toolchain.
    if (String(message).includes('react-test-renderer is deprecated')) return;
    originalError(message, ...args);
  });
  loadAppState.mockResolvedValue({
    ...DEFAULT_APP_STATE,
    permissions: { location: true, notifications: true },
  });
  loadPreparednessProgress.mockResolvedValue(DEFAULT_PREPAREDNESS_PROGRESS);
  loadChecklistState.mockResolvedValue({});
  loadLocalConditions.mockResolvedValue(snapshot('Live river warning'));
  notifyNewWarnings.mockResolvedValue([]);
  notifySimulatedWarning.mockResolvedValue(true);
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  consoleError.mockRestore();
  alertSpy.mockRestore();
  delete global.IS_REACT_ACT_ENVIRONMENT;
  jest.useRealTimers();
});

test.each([HomeDashboardScreen, AlertsScreen])(
  '%p keeps live warnings visible when notifications fail',
  async (Screen) => {
    notifyNewWarnings.mockRejectedValue(new Error('Notification service unavailable'));
    await act(async () => {
      tree = create(<Screen navigation={navigation} />);
    });
    const rendered = JSON.stringify(tree.toJSON());
    expect(rendered).toContain('Live river warning');
    expect(rendered).toContain('Emergency notifications could not be delivered');
    expect(notifyNewWarnings).toHaveBeenCalled();
  },
);

test.each([HomeDashboardScreen, AlertsScreen])(
  '%p ignores an older response after a newer refresh finishes',
  async (Screen) => {
    let resolveOld;
    loadLocalConditions.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    await act(async () => {
      tree = create(<Screen navigation={navigation} />);
    });
    loadLocalConditions.mockResolvedValue(snapshot('New location warning'));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5 * 60 * 1000);
    });
    expect(JSON.stringify(tree.toJSON())).toContain('New location warning');
    await act(async () => {
      resolveOld(snapshot('Old location warning'));
    });
    const rendered = JSON.stringify(tree.toJSON());
    expect(rendered).toContain('New location warning');
    expect(rendered).not.toContain('Old location warning');
    expect(notifyNewWarnings).toHaveBeenCalledTimes(1);
  },
);

test.each([HomeDashboardScreen, AlertsScreen])('%p discards pending work when it unmounts', async (Screen) => {
  let resolvePending;
  loadLocalConditions.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolvePending = resolve;
      }),
  );
  await act(async () => {
    tree = create(<Screen navigation={navigation} />);
  });
  await act(async () => {
    tree.unmount();
  });
  tree = null;
  await act(async () => {
    resolvePending(snapshot('Late warning'));
  });
  expect(notifyNewWarnings).not.toHaveBeenCalled();
});

test('a failed settings save retains the previous switch value and shows an error', async () => {
  updateAppState.mockRejectedValueOnce(new Error('Storage full'));
  await act(async () => {
    tree = create(<SettingsDetailScreen route={{ params: { category: 'accessibility' } }} navigation={navigation} />);
  });
  const largeTextSwitch = () =>
    tree.root.findAllByType(Switch).find((row) => row.props.accessibilityLabel === 'Larger text');
  expect(largeTextSwitch().props.value).toBe(false);
  await act(async () => {
    await largeTextSwitch().props.onValueChange(true);
  });
  expect(largeTextSwitch().props.value).toBe(false);
  expect(Alert.alert).toHaveBeenCalledWith('Settings not saved', expect.any(String));
});

test('a reminder scheduling failure preserves the saved setting and reports the separate failure', async () => {
  updateAppState.mockResolvedValueOnce({
    ...DEFAULT_APP_STATE,
    settings: { ...DEFAULT_APP_STATE.settings, preparednessReminders: false },
  });
  syncPreparednessReminder.mockRejectedValueOnce(new Error('Notification service unavailable'));
  await act(async () => {
    tree = create(
      <SettingsDetailScreen route={{ params: { category: 'location-notifications' } }} navigation={navigation} />,
    );
  });
  const reminderSwitch = () =>
    tree.root.findAllByType(Switch).find((row) => row.props.accessibilityLabel === 'Preparedness reminders');
  await act(async () => {
    await reminderSwitch().props.onValueChange(false);
  });
  expect(reminderSwitch().props.value).toBe(false);
  expect(Alert.alert).toHaveBeenCalledWith('Reminder not updated', expect.any(String));
});
