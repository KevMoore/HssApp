import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Logo } from '../../components/ui/Logo';
import { theme } from '../../constants/theme';
import { openHSSWebsite } from '../../utils/linking';

export default function AboutScreen() {
  const handleLinkPress = (url: string) => {
    openHSSWebsite(url);
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
          <Logo variant="full" height={60} style={styles.logo} />
          <Text style={styles.tagline}>
            The home of domestic and commercial boiler spares!
          </Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About HSS Spares</Text>
          <Text style={styles.sectionText}>
            Heating Spares Specialists are a UK supplier of domestic and
            commercial heating spares. Our extensive range of spares includes
            manufacturers such as Worcester Bosch, Vaillant, GlowWorm, Ideal,
            Baxi, Hamworthy, Grant, and many, many more.
          </Text>
          <Text style={styles.sectionText}>
            Founded in 1993, we have over 30 years of trading history and
            experience in the heating industry.
          </Text>
        </View>

        {/* Why HSS Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why HSS?</Text>
          <View style={styles.featureList}>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.success}
              />
              <Text style={styles.featureText}>
                10% discount automatically applied to all online orders
              </Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.success}
              />
              <Text style={styles.featureText}>
                Next day UK delivery as standard if ordered before 3pm
              </Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.success}
              />
              <Text style={styles.featureText}>
                Expert support available on the phone and at our 3 branches
              </Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.success}
              />
              <Text style={styles.featureText}>
                10,000+ stocked products, ready to ship
              </Text>
            </View>
            <View style={styles.feature}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.success}
              />
              <Text style={styles.featureText}>
                We buy direct from all leading manufacturers
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => router.push('/faqs')}
          >
            <Ionicons
              name="help-circle-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.linkText}>FAQs</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => router.push('/contact-us')}
          >
            <Ionicons
              name="mail-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.linkText}>Contact Us</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => handleLinkPress('/trade-account')}
          >
            <Ionicons
              name="business-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.linkText}>Open Trade Account</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => openHSSWebsite()}
          >
            <Ionicons
              name="globe-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.linkText}>Visit Website</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 HSS Boiler & Heating Spares. All rights reserved.
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
  logo: {
    marginBottom: theme.spacing.md,
  },
  tagline: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  sectionText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    lineHeight: 24,
  },
  featureList: {
    gap: theme.spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  featureText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
    gap: theme.spacing.md,
  },
  linkText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
    fontWeight: '500',
  },
  footer: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});

