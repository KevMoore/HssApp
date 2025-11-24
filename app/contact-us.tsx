import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { postEnquiry, EnquiryFormData } from '../services/enquiryService';

export default function ContactUsScreen() {
  const [formData, setFormData] = useState<EnquiryFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await postEnquiry(formData);
      
      if (response.success) {
        Alert.alert('Success', response.message || 'Thank you for your enquiry!', [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to submit enquiry');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Contact Us</Text>
            <Text style={styles.subtitle}>
              Get in touch with our team for expert advice
            </Text>
          </View>

          {/* Contact Methods */}
          <View style={styles.section}>
            <View style={styles.contactCard}>
              <View style={styles.contactRow}>
                <Ionicons
                  name="call-outline"
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Call us</Text>
                  <TouchableOpacity
                    onPress={() => handlePhonePress('01202 718660')}
                  >
                    <Text style={styles.contactValue}>01202 718660</Text>
                  </TouchableOpacity>
                  <Text style={styles.contactNote}>
                    Monday - Friday: 8am - 5pm{'\n'}Saturday: 8am - midday
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.contactCard}>
              <View style={styles.contactRow}>
                <Ionicons
                  name="mail-outline"
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Email us</Text>
                  <TouchableOpacity
                    onPress={() => handleEmailPress('poole.sales@hssspares.co.uk')}
                  >
                    <Text style={styles.contactValue}>
                      poole.sales@hssspares.co.uk
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Enquiry Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send us an enquiry</Text>
            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Your name"
                  placeholderTextColor={theme.colors.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  placeholder="your.email@example.com"
                  placeholderTextColor={theme.colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Subject (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.subject}
                  onChangeText={(text) =>
                    setFormData({ ...formData, subject: text })
                  }
                  placeholder="What is your enquiry about?"
                  placeholderTextColor={theme.colors.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Message <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.message}
                  onChangeText={(text) =>
                    setFormData({ ...formData, message: text })
                  }
                  placeholder="Tell us how we can help..."
                  placeholderTextColor={theme.colors.textLight}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <Button
                title="Send Enquiry"
                onPress={handleSubmit}
                variant="primary"
                size="large"
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.submitButton}
              />
            </View>
          </View>

          {/* Store Locations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visit our stores</Text>
            <View style={styles.storeCard}>
              <Text style={styles.storeName}>Poole Head Office</Text>
              <Text style={styles.storePhone}>01202 718660</Text>
              <Text style={styles.storeAddress}>
                Unit 12, Wessex Trade Centre{'\n'}Old Wareham Road{'\n'}Poole,
                Dorset BH12 3PQ
              </Text>
            </View>

            <View style={styles.storeCard}>
              <Text style={styles.storeName}>Salisbury</Text>
              <Text style={styles.storePhone}>01722 273222</Text>
              <Text style={styles.storeAddress}>
                Unit 2, Penton Business Park{'\n'}Stephenson Road{'\n'}Salisbury
                SP2 7NP
              </Text>
            </View>

            <View style={styles.storeCard}>
              <Text style={styles.storeName}>Southampton</Text>
              <Text style={styles.storePhone}>02380 770008</Text>
              <Text style={styles.storeAddress}>
                Unit 4, Tanners Brook Way{'\n'}Millbrook{'\n'}Southampton,
                Hampshire SO15 0JY
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
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
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  contactCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  contactValue: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  contactNote: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  formCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 44,
  },
  textArea: {
    minHeight: 120,
    paddingTop: theme.spacing.md,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  storeCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  storeName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  storePhone: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  storeAddress: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

