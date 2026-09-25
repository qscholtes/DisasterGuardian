import React, { useCallback, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '../styles/Styles';

import { DEFAULT_FACILITY_RADIUS_METRES, fetchNearbyEmergencyFacilities } from '../utils/overpassFacilities';
import FacilityResultCard from './FacilityResultCard';
import RadiusControl from './RadiusControl';

function openInMaps(facility) {
  const label = encodeURIComponent(facility.name);
  const destination = `${facility.latitude},${facility.longitude}`;
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${destination}&q=${label}`
      : `geo:${destination}?q=${destination}(${label})`;
  Linking.openURL(url).catch(() => {});
}

function callFacility(facility) {
  if (facility.phone) {
    Linking.openURL(`tel:${facility.phone}`).catch(() => {});
  }
}

function formatRadius(radiusMetres) {
  return `${radiusMetres / 1000} km`;
}

const FACILITY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'Hospital', label: 'Hospitals' },
  { key: 'Police station', label: 'Police' },
  { key: 'Fire station', label: 'Fire stations' },
  { key: 'Mapped/potential shelter', label: 'Shelters' },
];

export default function EmergencyServicesScreen() {
  const [facilities, setFacilities] = useState([]);
  const [location, setLocation] = useState(null);
  const [radiusMetres, setRadiusMetres] = useState(DEFAULT_FACILITY_RADIUS_METRES);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const requestId = useRef(0);
  const radiusRef = useRef(DEFAULT_FACILITY_RADIUS_METRES);

  const updateFacilities = useCallback(async (coordinates, requestedRadius = radiusRef.current) => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setLocation(coordinates);
    setLoading(true);
    setError(null);
    try {
      const nextFacilities = await fetchNearbyEmergencyFacilities(coordinates, requestedRadius);
      if (currentRequest === requestId.current) {
        setFacilities(nextFacilities);
      }
    } catch {
      if (currentRequest === requestId.current) {
        setFacilities([]);
        setError('Nearby services are temporarily unavailable. Check your connection and try again.');
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let watcher = null;

      const startLocationUpdates = async () => {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (!permission.granted) {
          setPermissionDenied(true);
          setLoading(false);
          return;
        }
        setPermissionDenied(false);
        const currentPosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        updateFacilities(currentPosition.coords);
        watcher = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 100 },
          (nextPosition) => {
            if (active) updateFacilities(nextPosition.coords);
          },
        );
        if (!active) watcher?.remove();
      };

      startLocationUpdates().catch(() => {
        if (active) {
          setLoading(false);
          setError('Unable to access your current location.');
        }
      });

      return () => {
        active = false;
        requestId.current += 1;
        watcher?.remove();
      };
    }, [updateFacilities]),
  );

  const visibleFacilities =
    selectedType === 'all' ? facilities : facilities.filter((facility) => facility.type === selectedType);
  const selectedFilter = FACILITY_FILTERS.find((filter) => filter.key === selectedType);
  const selectedLabel = selectedType === 'all' ? 'facilities' : selectedFilter.label.toLowerCase();

  const handleRadiusChange = (nextRadius) => {
    radiusRef.current = nextRadius;
    setRadiusMetres(nextRadius);
    if (location) updateFacilities(location, nextRadius);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Emergency services</Text>
          <Text style={styles.title}>Nearby help</Text>
          <Text style={styles.body}>
            Choose what you need and search for nearby help within a radius of your current location.
          </Text>
          {location ? (
            <Text style={styles.locationText}>Location updates are active while this screen is open.</Text>
          ) : null}
        </View>

        <View style={styles.controlsCard}>
          <Text style={styles.controlLabel}>Service type</Text>
          <View style={styles.filterRow}>
            {FACILITY_FILTERS.map((filter) => (
              <Pressable
                key={filter.key}
                style={[styles.filterButton, selectedType === filter.key && styles.filterButtonSelected]}
                onPress={() => setSelectedType(filter.key)}
              >
                <Text style={[styles.filterButtonText, selectedType === filter.key && styles.filterButtonTextSelected]}>
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.radiusHeader}>
            <Text style={styles.controlLabel}>Search radius</Text>
            <Text style={styles.radiusValue}>{formatRadius(radiusMetres)}</Text>
          </View>
          <RadiusControl value={radiusMetres} onChange={setRadiusMetres} onChangeEnd={handleRadiusChange} />
        </View>

        {permissionDenied ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Location permission needed</Text>
            <Text style={styles.messageBody}>Allow location access to find nearby emergency services.</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Looking for nearby help...</Text>
            <Text style={styles.messageBody}>Checking your current location for facilities in this area.</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Services unavailable</Text>
            <Text style={styles.messageBody}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && !permissionDenied && !visibleFacilities.length ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>No {selectedLabel} found</Text>
            <Text style={styles.messageBody}>
              No mapped {selectedLabel} were found within {formatRadius(radiusMetres)}.
            </Text>
          </View>
        ) : null}

        {!loading &&
          !error &&
          !permissionDenied &&
          visibleFacilities.map((facility) => (
            <FacilityResultCard
              key={facility.id}
              facility={facility}
              onOpenMaps={openInMaps}
              onCallFacility={callFacility}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f2',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    gap: 12,
  },
  heroCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 18,
    gap: 6,
  },
  eyebrow: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#171717',
    fontSize: 26,
    fontWeight: '700',
  },
  body: {
    color: '#525252',
    fontSize: 14,
    lineHeight: 20,
  },
  locationText: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  messageCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 5,
  },
  messageTitle: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
  messageBody: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
  controlsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 14,
    gap: 12,
  },
  controlLabel: {
    color: '#171717',
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#d4d8d2',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fbfbf9',
  },
  filterButtonSelected: {
    backgroundColor: '#171717',
    borderColor: '#171717',
  },
  filterButtonText: {
    color: '#4d574f',
    fontSize: 12,
    fontWeight: '700',
  },
  filterButtonTextSelected: {
    color: '#ffffff',
  },
  radiusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radiusValue: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '800',
  },
});
