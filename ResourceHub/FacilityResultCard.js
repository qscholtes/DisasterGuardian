import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function formatDistance(distance) {
  return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
}

function getFacilityIcon(type) {
  if (type === 'Hospital') return 'hospital-building';
  if (type === 'Police station') return 'police-badge-outline';
  if (type === 'Fire station') return 'fire-truck';
  if (type === 'Mapped/potential shelter') return 'home-group';
  return 'map-marker-radius-outline';
}
// Displays a nearby facility returned by the map service, with call and directions actions.
export default function FacilityResultCard({ facility, onOpenMaps, onCallFacility }) {
  return (
    <View style={styles.facilityCard}>
      <View style={styles.facilityHeader}>
        <View style={styles.facilityIcon}>
          <MaterialCommunityIcons name={getFacilityIcon(facility.type)} size={22} color="#4d7c5a" />
        </View>
        <View style={styles.facilityCopy}>
          <Text style={styles.facilityName}>{facility.name}</Text>
          <Text style={styles.facilityType}>{facility.type}</Text>
        </View>
        <Text style={styles.distance}>{formatDistance(facility.distance)}</Text>
      </View>
      {facility.address ? <Text style={styles.facilityMeta}>{facility.address}</Text> : null}
      <Text style={styles.facilityMeta}>
        {facility.openingHours ? `Opening information: ${facility.openingHours}` : 'Opening information is not listed.'}
      </Text>
      {facility.isPotentialShelter ? (
        <Text style={styles.shelterNote}>
          Mapped/potential shelter — not confirmation of an active evacuation centre.
        </Text>
      ) : null}
      <View style={styles.facilityActions}>
        <Pressable
          style={styles.mapButton}
          onPress={() => onOpenMaps(facility)}
          accessibilityRole="button"
          accessibilityLabel={`Get directions to ${facility.name}`}
        >
          <MaterialCommunityIcons name="directions" size={17} color="#ffffff" />
          <Text style={styles.mapButtonText}>Directions</Text>
        </Pressable>
        {facility.phone ? (
          <Pressable
            style={styles.callButton}
            onPress={() => onCallFacility(facility)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${facility.name}`}
          >
            <MaterialCommunityIcons name="phone" size={17} color="#171717" />
            <Text style={styles.callButtonText}>Call</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  facilityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 14,
    gap: 9,
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  facilityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9eee9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityCopy: {
    flex: 1,
    gap: 3,
  },
  facilityName: {
    color: '#171717',
    fontSize: 16,
    fontWeight: '700',
  },
  facilityType: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '700',
  },
  distance: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '800',
  },
  facilityMeta: {
    color: '#525252',
    fontSize: 13,
    lineHeight: 18,
  },
  shelterNote: {
    color: '#8a5a00',
    backgroundColor: '#fff8e7',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    lineHeight: 17,
  },
  facilityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    backgroundColor: '#171717',
    borderRadius: 7,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  callButton: {
    flexDirection: 'row',
    gap: 7,
    borderWidth: 1,
    borderColor: '#171717',
    borderRadius: 7,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: {
    color: '#171717',
    fontSize: 13,
    fontWeight: '700',
  },
});
