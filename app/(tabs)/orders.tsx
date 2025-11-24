import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function OrdersScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons
            name="cube-outline"
            size={80}
            color={theme.colors.primary}
          />
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>
            Order tracking coming soon
          </Text>
        </View>

        {/* Coming Soon Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          <View style={styles.comingSoonCard}>
            <Ionicons
              name="time-outline"
              size={32}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.comingSoonTitle}>Order Tracking</Text>
            <Text style={styles.comingSoonText}>
              We're working on bringing you order management features including:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• View order history</Text>
              <Text style={styles.featureItem}>• Track order status</Text>
              <Text style={styles.featureItem}>• View order details</Text>
              <Text style={styles.featureItem}>• Download invoices</Text>
              <Text style={styles.featureItem}>• Reorder items</Text>
              <Text style={styles.featureItem}>• Delivery tracking</Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={32}
            color={theme.colors.primary}
          />
          <Text style={styles.infoTitle}>Need Help?</Text>
          <Text style={styles.infoText}>
            For order inquiries, please contact our customer service team or visit one of our stores.
          </Text>
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
    paddingBottom: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  comingSoonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  comingSoonTitle: {
    ...theme.typography.h3,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  comingSoonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  featureList: {
    width: '100%',
    gap: theme.spacing.xs,
  },
  featureItem: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
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
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  infoText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

