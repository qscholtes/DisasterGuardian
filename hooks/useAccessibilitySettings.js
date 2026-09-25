import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { loadAppState } from '../storage/appState';
import { ignoreError } from '../utils/ignoreError';

const DEFAULT_ACCESSIBILITY_SETTINGS = { largeText: false, highContrast: false };

export default function useAccessibilitySettings() {
  const [accessibilitySettings, setAccessibilitySettings] = useState(DEFAULT_ACCESSIBILITY_SETTINGS);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      loadAppState()
        .then((storedState) => {
          if (active) {
            setAccessibilitySettings({
              largeText: Boolean(storedState.settings.largeText),
              highContrast: Boolean(storedState.settings.highContrast),
            });
          }
        })
        .catch(ignoreError);

      return () => {
        active = false;
      };
    }, []),
  );

  return accessibilitySettings;
}
