import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { openHSSWebsite } from '../../utils/linking';

interface Store {
  name: string;
  phone: string;
  address: string[];
  email?: string;
}

const stores: Store[] = [
  {
    name: 'Poole Head Office',
    phone: '01202 718660',
    address: [
      'Unit 12, Wessex Trade Centre',
      'Old Wareham Road',
      'Poole, Dorset',
      'BH12 3PQ',
    ],
    email: 'poole.sales@hssspares.co.uk',
  },
  {
    name: 'Southampton',
    phone: '02380 770008',
    address: [
      'Unit 4, Tanners Brook Way',
      'Millbrook',
      'Southampton, Hampshire',
      'SO15 0JY',
    ],
  },
  {
    name: 'Salisbury',
    phone: '01722 273222',
    address: [
      'Unit 2, Penton Business Park',
      'Stephenson Road',
      'Salisbury',
      'SP2 7NP',
    ],
  },
];

export default function StoresScreen() {
  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleMapPress = (store: Store) => {
    // Open map with address - could use expo-location or maps API
    const address = store.address.join(', ');
    Linking.openURL(
      `https://maps.google.com/?q=${encodeURIComponent(address)}`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Our Stores</Text>
          <Text style={styles.subtitle}>
            Visit us in person or call for expert advice
          </Text>
        </View>

        {stores.map((store, index) => (
          <View key={index} style={styles.storeCard}>
            <View style={styles.storeHeader}>
              <Ionicons
                name="location"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.storeName}>{store.name}</Text>
            </View>

            <View style={styles.storeDetails}>
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => handlePhonePress(store.phone)}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.contactText}>{store.phone}</Text>
              </TouchableOpacity>

              {store.email && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => handleEmailPress(store.email!)}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.contactText}>{store.email}</Text>
                </TouchableOpacity>
              )}

              <View style={styles.addressContainer}>
                {store.address.map((line, i) => (
                  <Text key={i} style={styles.addressLine}>
                    {line}
                  </Text>
                ))}
              </View>

              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => handleMapPress(store)}
              >
                <Ionicons
                  name="map-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.mapButtonText}>View on Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.infoCard}>
          <Ionicons
            name="time-outline"
            size={32}
            color={theme.colors.primary}
          />
          <Text style={styles.infoTitle}>Opening Hours</Text>
          <Text style={styles.infoText}>
            Monday - Friday: 8:00 AM - 5:00 PM
          </Text>
          <Text style={styles.infoText}>Saturday: 9:00 AM - 1:00 PM</Text>
          <Text style={styles.infoText}>Sunday: Closed</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
	scrollContent: {
		padding: theme.spacing.md,
		paddingBottom: theme.spacing.xxl + theme.spacing.lg, // Extra padding for native tabs
	},
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  storeCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  storeName: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  storeDetails: {
    gap: theme.spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  contactText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  addressContainer: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  addressLine: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  mapButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.sm,
  },
  infoTitle: {
    ...theme.typography.h3,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
});

