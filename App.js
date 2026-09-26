import React, { useEffect, useState } from 'react';
import { AppState, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import PermissionsScreen from './Authentication/PermissionsScreen';
import WelcomeScreen from './Authentication/WelcomeScreen';
import HomeDashboardScreen from './Dashboard/HomeDashboardScreen';
import PrepareScreen from './Dashboard/PrepareScreen';
import QuizzesScreen from './Dashboard/QuizzesScreen';
import ProfileScreen from './Profile/ProfileScreen';
import SettingsDetailScreen from './Profile/SettingsDetailScreen';
import EmergencyKitChallenge from './Preparedness/EmergencyKit/EmergencyKitChallenge';
import ChecklistScreen from './Preparedness/checklist/ChecklistScreen';
import QuizScreen from './Preparedness/quizzes/QuizScreen';
import AlertsScreen from './Dashboard/AlertsScreen';
import LearnScreen from './ResourceHub/LearnScreen';
import EmergencyServicesScreen from './ResourceHub/EmergencyServicesScreen';
import DisasterTopicScreen from './ResourceHub/DisasterTopicScreen';
import EmergencyResponseScreen from './Dashboard/EmergencyResponseScreen';
import { loadAppState, processDailyStreakReward, updateAppState } from './storage/appState';
import { syncPreparednessReminder } from './utils/emergencyNotifications';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

function getSettingsTitle(category) {
  if (category === 'location-notifications') return 'Location and notifications';
  if (category === 'accessibility') return 'Accessibility settings';
  return 'Settings';
}

function handleNotificationResponse(response) {
  const notificationData = response?.notification?.request?.content?.data;
  if (!notificationData?.route || !navigationRef.isReady()) {
    return;
  }

  navigationRef.navigate(notificationData.route, { warning: notificationData.warning });
}

export default function App() {
  const [initialAppState, setInitialAppState] = useState(null);

  useEffect(() => {
    let active = true;

    processDailyStreakReward()
      .then(({ appState }) => {
        syncPreparednessReminder(appState).catch(() => {});
        if (active) {
          setInitialAppState(appState);
        }
      })
      .catch(async () => {
        if (active) {
          setInitialAppState(await loadAppState());
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!initialAppState) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        processDailyStreakReward().catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [initialAppState]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => subscription.remove();
  }, []);

  if (!initialAppState) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => handleNotificationResponse(Notifications.getLastNotificationResponse())}
        >
          <StatusBar style="dark" />
          <Stack.Navigator
            initialRouteName={initialAppState.onboardingComplete ? 'HomeDashboard' : 'Welcome'}
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#07101d' },
            }}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Permissions">
              {(props) => <PermissionsScreen {...props} onComplete={updateAppState} />}
            </Stack.Screen>
            <Stack.Screen name="HomeDashboard" component={HomeDashboardScreen} />
            <Stack.Screen
              name="EmergencyKitChallenge"
              component={EmergencyKitChallenge}
              options={{
                headerShown: true,
                title: 'Emergency Kit Challenge',
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="ResourceHub"
              component={LearnScreen}
              options={{
                headerShown: true,
                title: 'Learn',
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="EmergencyServices"
              component={EmergencyServicesScreen}
              options={{
                headerShown: true,
                title: 'Emergency Services',
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="DisasterTopic"
              component={DisasterTopicScreen}
              options={{
                headerShown: true,
                title: 'Resource',
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="PrepareOverview"
              component={PrepareScreen}
              options={{
                headerShown: true,
                title: 'Prepare',
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="Checklist"
              component={ChecklistScreen}
              options={{
                headerShown: true,
                title: 'Go-bag Checklist',
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="Quizzes"
              component={QuizzesScreen}
              options={{
                headerShown: true,
                title: 'Quizzes',
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="Quiz"
              component={QuizScreen}
              options={{
                headerShown: true,
                title: 'Quiz',
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="AlertsOverview"
              component={AlertsScreen}
              options={{
                headerShown: true,
                title: 'Alerts',
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="EmergencyResponse"
              component={EmergencyResponseScreen}
              options={{
                headerShown: true,
                title: 'Emergency response',
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="ProfileSettings"
              component={ProfileScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: 'Profile',
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
                headerRight: () => (
                  <Pressable
                    onPress={() => navigation.navigate('ProfileSettingsDetail', { category: 'hub' })}
                    accessibilityRole="button"
                    accessibilityLabel="Open settings"
                    accessibilityHint="Open location, notification, and accessibility settings"
                    hitSlop={10}
                    style={{ padding: 4 }}
                  >
                    <MaterialCommunityIcons name="cog-outline" size={24} color="#171717" accessible={false} />
                  </Pressable>
                ),
              })}
            />
            <Stack.Screen
              name="ProfileSettingsDetail"
              component={SettingsDetailScreen}
              options={({ route }) => ({
                headerShown: true,
                title: getSettingsTitle(route.params?.category),
                headerTintColor: '#171717',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTitleStyle: { color: '#171717' },
                headerBackButtonDisplayMode: 'minimal',
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
