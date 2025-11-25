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
import { router } from 'expo-router';
import { theme } from '../../constants/theme';
import { openHSSWebsite } from '../../utils/linking';
import { Button } from '../../components/ui/Button';

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

export default function AboutScreen() {
	const handleTradeAccountPress = () => {
		openHSSWebsite('/open-trade-account/');
	};

	const handlePhonePress = (phone: string) => {
		Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
	};

	const handleEmailPress = (email: string) => {
		Linking.openURL(`mailto:${email}`);
	};

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				showsHorizontalScrollIndicator={false}
			>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.mainTitle}>Open Trade Account</Text>
					<Text style={styles.subtitle}>
						Are you in the plumbing and heating trade?
					</Text>
				</View>

				{/* Intro Section */}
				<View style={styles.section}>
					<Text style={styles.sectionText}>
						Heating Spares Specialists Ltd offers trade accounts to businesses
						working in the plumbing and heating industries.
					</Text>
				</View>

				{/* Benefits Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Benefits</Text>
					<Text style={styles.sectionSubtitle}>
						Benefits to signing up for a trade account include:
					</Text>
					<View style={styles.benefitsList}>
						<View style={styles.benefit}>
							<Ionicons
								name="checkmark-circle"
								size={24}
								color={theme.colors.success}
							/>
							<Text style={styles.benefitText}>
								<Text style={styles.benefitBold}>Trade only discount</Text> on
								all heating spares
							</Text>
						</View>
						<View style={styles.benefit}>
							<Ionicons
								name="checkmark-circle"
								size={24}
								color={theme.colors.success}
							/>
							<Text style={styles.benefitText}>
								Full <Text style={styles.benefitBold}>credit account</Text>{' '}
								facilities
							</Text>
						</View>
						<View style={styles.benefit}>
							<Ionicons
								name="checkmark-circle"
								size={24}
								color={theme.colors.success}
							/>
							<Text style={styles.benefitText}>
								<Text style={styles.benefitBold}>Monthly invoicing</Text>
							</Text>
						</View>
						<View style={styles.benefit}>
							<Ionicons
								name="checkmark-circle"
								size={24}
								color={theme.colors.success}
							/>
							<Text style={styles.benefitText}>
								Online access to your{' '}
								<Text style={styles.benefitBold}>trade discount prices</Text>
							</Text>
						</View>
					</View>
				</View>

				{/* CTA Section */}
				<View style={styles.ctaSection}>
					<Text style={styles.ctaText}>
						Want to apply for an HSS trade/credit account?
					</Text>
					<Button
						title="Apply for Trade Account"
						onPress={handleTradeAccountPress}
						variant="primary"
						size="large"
						style={styles.ctaButton}
					/>
				</View>

				{/* Stores Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Our Stores</Text>
					{stores.map((store, index) => (
						<View key={index} style={styles.storeCard}>
							<View style={styles.storeHeader}>
								<Ionicons
									name="location"
									size={20}
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
										size={18}
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
											size={18}
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
							</View>
						</View>
					))}
				</View>

				{/* Helpful Links */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Helpful Links</Text>
					<TouchableOpacity
						style={styles.linkCard}
						onPress={() => router.push('/faqs')}
					>
						<Ionicons
							name="help-circle-outline"
							size={24}
							color={theme.colors.primary}
						/>
						<Text style={styles.linkText}>Terms & Conditions</Text>
						<Ionicons
							name="chevron-forward"
							size={20}
							color={theme.colors.textSecondary}
						/>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.linkCard}
						onPress={() => router.push('/faqs')}
					>
						<Ionicons
							name="document-text-outline"
							size={24}
							color={theme.colors.primary}
						/>
						<Text style={styles.linkText}>Delivery & Returns</Text>
						<Ionicons
							name="chevron-forward"
							size={20}
							color={theme.colors.textSecondary}
						/>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.linkCard}
						onPress={() => router.push('/faqs')}
					>
						<Ionicons
							name="shield-checkmark-outline"
							size={24}
							color={theme.colors.primary}
						/>
						<Text style={styles.linkText}>Company Policies</Text>
						<Ionicons
							name="chevron-forward"
							size={20}
							color={theme.colors.textSecondary}
						/>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.linkCard}
						onPress={() => openHSSWebsite('/account-login')}
					>
						<Ionicons
							name="log-in-outline"
							size={24}
							color={theme.colors.primary}
						/>
						<Text style={styles.linkText}>Account Login</Text>
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
		marginBottom: theme.spacing.xl,
		alignItems: 'center',
	},
	mainTitle: {
		...theme.typography.h1,
		color: theme.colors.primary,
		marginBottom: theme.spacing.sm,
		textAlign: 'center',
	},
	subtitle: {
		...theme.typography.h3,
		color: theme.colors.text,
		textAlign: 'center',
		fontWeight: '500',
	},
	section: {
		marginBottom: theme.spacing.xl,
	},
	sectionTitle: {
		...theme.typography.h2,
		marginBottom: theme.spacing.sm,
		color: theme.colors.primary,
	},
	sectionSubtitle: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.md,
	},
	sectionText: {
		...theme.typography.body,
		color: theme.colors.text,
		lineHeight: 24,
	},
	benefitsList: {
		gap: theme.spacing.md,
		marginTop: theme.spacing.md,
	},
	benefit: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: theme.spacing.sm,
	},
	benefitText: {
		...theme.typography.body,
		color: theme.colors.text,
		flex: 1,
		lineHeight: 24,
	},
	benefitBold: {
		fontWeight: '600',
		color: theme.colors.text,
	},
	ctaSection: {
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.lg,
		marginBottom: theme.spacing.xl,
		alignItems: 'center',
		...theme.shadows.md,
	},
	ctaText: {
		...theme.typography.body,
		color: theme.colors.text,
		textAlign: 'center',
		marginBottom: theme.spacing.md,
		lineHeight: 24,
	},
	ctaButton: {
		width: '100%',
	},
	storeCard: {
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		...theme.shadows.sm,
	},
	storeHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: theme.spacing.sm,
		gap: theme.spacing.sm,
	},
	storeName: {
		...theme.typography.h3,
		color: theme.colors.text,
	},
	storeDetails: {
		gap: theme.spacing.xs,
	},
	contactRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.sm,
	},
	contactText: {
		...theme.typography.bodySmall,
		color: theme.colors.text,
	},
	addressContainer: {
		marginTop: theme.spacing.xs,
		marginBottom: theme.spacing.xs,
	},
	addressLine: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.xs / 2,
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
