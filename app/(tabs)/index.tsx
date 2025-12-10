import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar, SearchBarRef } from '../../components/ui/SearchBar';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { ApplianceModal } from '../../components/appliances/ApplianceModal';
import { theme } from '../../constants/theme';
import { getPopularManufacturers } from '../../services/partsService';
import { openHSSWebsite, openTradeAccountSignup } from '../../utils/linking';
import { saveSearchTerm } from '../../services/searchHistoryService';
import { Appliance } from '../../services/applianceService';

export default function HomeScreen() {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState('');
	const [searchMode, setSearchMode] = useState<
		'appliance' | 'part' | 'keyword'
	>('keyword');
	const [isApplianceModalVisible, setIsApplianceModalVisible] = useState(false);
	const [popularManufacturers, setPopularManufacturers] = useState<string[]>([]);
	const [loadingManufacturers, setLoadingManufacturers] = useState(true);
	const searchBarRef = useRef<SearchBarRef>(null);
	const PART_PREFIX = 'GC-';

	const handleSearch = useCallback(async () => {
		if (searchQuery.trim()) {
			let trimmedQuery = searchQuery.trim();
			// Remove GC- prefix before searching if in part mode
			if (searchMode === 'part' && trimmedQuery.startsWith(PART_PREFIX)) {
				trimmedQuery = trimmedQuery.substring(PART_PREFIX.length);
			}
			// Save to search history
			await saveSearchTerm(trimmedQuery, searchMode);

			router.push({
				pathname: '/search',
				params: { q: trimmedQuery, mode: searchMode },
			});
		}
	}, [searchQuery, searchMode, router]);

	const handleModeChange = (mode: 'appliance' | 'part' | 'keyword') => {
		const previousMode = searchMode;
		setSearchMode(mode);

		if (mode === 'part') {
			// Set prefix and position cursor after hyphen
			setSearchQuery(PART_PREFIX);
			// Use setTimeout to ensure the TextInput is ready
			setTimeout(() => {
				searchBarRef.current?.setSelection(
					PART_PREFIX.length,
					PART_PREFIX.length
				);
				searchBarRef.current?.focus();
			}, 100);
		} else {
			// Remove GC- prefix if switching away from part mode
			let newQuery = searchQuery;
			if (previousMode === 'part' && newQuery.startsWith(PART_PREFIX)) {
				newQuery = newQuery.substring(PART_PREFIX.length);
			}
			setSearchQuery(newQuery);
		}

		if (mode === 'appliance') {
			// Open modal for appliance selection
			setIsApplianceModalVisible(true);
		}
	};

	const handleSearchQueryChange = (text: string) => {
		if (searchMode === 'part') {
			// Remove any duplicate GC- prefixes that might have been added
			while (text.startsWith(PART_PREFIX + PART_PREFIX)) {
				text = text.substring(PART_PREFIX.length);
			}

			// Ensure GC- prefix is always present
			if (!text.startsWith(PART_PREFIX)) {
				// If user tries to delete the prefix, restore it
				if (text.length < PART_PREFIX.length) {
					text = PART_PREFIX;
				} else {
					// If prefix was somehow removed, add it back
					text = PART_PREFIX + text;
				}
			}
			// Prevent deletion of the prefix
			if (text.length < PART_PREFIX.length) {
				text = PART_PREFIX;
			}
		}
		setSearchQuery(text);
	};

	const handleApplianceSelect = useCallback(
		async (appliance: Appliance) => {
			setSearchMode('appliance');
			setSearchQuery(appliance.name);
			// Save to search history
			await saveSearchTerm(appliance.name, 'appliance');
			// Navigate to search with appliance
			router.push({
				pathname: '/search',
				params: { q: appliance.name, mode: 'appliance' },
			});
		},
		[router]
	);

	// Load manufacturers on mount
	useEffect(() => {
		const loadManufacturers = async () => {
			try {
				setLoadingManufacturers(true);
				const manufacturers = await getPopularManufacturers();
				setPopularManufacturers(manufacturers);
			} catch (error) {
				console.error('Error loading manufacturers:', error);
				// Set empty array on error - UI will handle gracefully
				setPopularManufacturers([]);
			} finally {
				setLoadingManufacturers(false);
			}
		};

		loadManufacturers();
	}, []);

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardView}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
				>
					{/* Hero Section */}
					<View style={styles.heroSection}>
						<Logo variant="full" height={50} style={styles.heroLogo} />
						<Text style={styles.heroTitle}>Find Boiler & Heating Parts</Text>
					</View>

					{/* Search Mode Selector */}
					<View style={styles.modeSelectorContainer}>
						<Text style={styles.modeSelectorTitle}>Search By</Text>
						<View style={styles.modeSelector}>
							<TouchableOpacity
								style={[
									styles.modeButton,
									searchMode === 'appliance' && styles.modeButtonActive,
								]}
								onPress={() => handleModeChange('appliance')}
							>
								<Ionicons
									name="home"
									size={24}
									color={
										searchMode === 'appliance'
											? '#ffffff'
											: theme.colors.textSecondary
									}
								/>
								<Text
									style={[
										styles.modeButtonText,
										searchMode === 'appliance' && styles.modeButtonTextActive,
									]}
								>
									Appliance
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.modeButton,
									searchMode === 'part' && styles.modeButtonActive,
								]}
								onPress={() => handleModeChange('part')}
							>
								<Ionicons
									name="cube"
									size={24}
									color={
										searchMode === 'part'
											? '#ffffff'
											: theme.colors.textSecondary
									}
								/>
								<Text
									style={[
										styles.modeButtonText,
										searchMode === 'part' && styles.modeButtonTextActive,
									]}
								>
									Part Number
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.modeButton,
									searchMode === 'keyword' && styles.modeButtonActive,
								]}
								onPress={() => handleModeChange('keyword')}
							>
								<Ionicons
									name="search"
									size={24}
									color={
										searchMode === 'keyword'
											? '#ffffff'
											: theme.colors.textSecondary
									}
								/>
								<Text
									style={[
										styles.modeButtonText,
										searchMode === 'keyword' && styles.modeButtonTextActive,
									]}
								>
									Keyword
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Search Bar */}
					<View style={styles.searchSection}>
						<SearchBar
							ref={searchBarRef}
							value={searchQuery}
							onChangeText={handleSearchQueryChange}
							onClear={() => {
								if (searchMode === 'part') {
									setSearchQuery(PART_PREFIX);
									setTimeout(() => {
										searchBarRef.current?.setSelection(
											PART_PREFIX.length,
											PART_PREFIX.length
										);
									}, 100);
								} else {
									setSearchQuery('');
								}
							}}
							placeholder={
								searchMode === 'appliance'
									? 'Search by appliance...'
									: searchMode === 'part'
									? 'Search by part number, GC number...'
									: 'Search by keyword...'
							}
							onSubmitEditing={handleSearch}
							onSuggestionSelect={async (suggestion) => {
								let finalSuggestion = suggestion;
								if (searchMode === 'part') {
									// Ensure suggestion has GC- prefix
									if (!finalSuggestion.startsWith(PART_PREFIX)) {
										finalSuggestion = PART_PREFIX + finalSuggestion;
									}
									setSearchQuery(finalSuggestion);
								} else {
									setSearchQuery(finalSuggestion);
								}
								// Immediately perform search with the selected suggestion
								let trimmedQuery = finalSuggestion.trim();
								// Remove GC- prefix before searching if in part mode
								if (
									searchMode === 'part' &&
									trimmedQuery.startsWith(PART_PREFIX)
								) {
									trimmedQuery = trimmedQuery.substring(PART_PREFIX.length);
								}
								if (trimmedQuery) {
									await saveSearchTerm(trimmedQuery, searchMode);
									router.push({
										pathname: '/search',
										params: { q: trimmedQuery, mode: searchMode },
									});
								}
							}}
							returnKeyType="search"
						/>
						<Button
							title="Search"
							onPress={handleSearch}
							variant="primary"
							size="large"
							style={styles.searchButton}
							disabled={!searchQuery.trim()}
						/>
					</View>

					{/* Quick Links */}
					<View style={styles.quickLinksSection}>
						<Text style={styles.sectionTitle}>Quick Links</Text>
						<View style={styles.quickLinks}>
							<TouchableOpacity
								style={styles.quickLink}
								onPress={() => openHSSWebsite()}
							>
								<Ionicons
									name="globe-outline"
									size={24}
									color={theme.colors.primary}
								/>
								<Text style={styles.quickLinkText}>Visit Website</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.quickLink}
								onPress={openTradeAccountSignup}
							>
								<Ionicons
									name="business-outline"
									size={24}
									color={theme.colors.primary}
								/>
								<Text style={styles.quickLinkText}>Trade Account</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Popular Manufacturers */}
					{!loadingManufacturers && popularManufacturers.length > 0 && (
						<View style={styles.manufacturersSection}>
							<Text style={styles.sectionTitle}>Popular Brands</Text>
							<View style={styles.manufacturersGrid}>
								{popularManufacturers.slice(0, 6).map((manufacturer) => (
									<TouchableOpacity
										key={manufacturer}
										style={styles.manufacturerChip}
										onPress={() => {
											setSearchQuery(manufacturer);
											setSearchMode('keyword');
										}}
									>
										<Text style={styles.manufacturerText}>{manufacturer}</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>
					)}

					{/* Info Section */}
					<View style={styles.infoSection}>
						<View style={styles.infoCard}>
							<Ionicons
								name="car-outline"
								size={32}
								color={theme.colors.primary}
							/>
							<Text style={styles.infoTitle}>Next Day Delivery</Text>
							<Text style={styles.infoText}>
								Order before 3pm for next day UK delivery
							</Text>
						</View>
						<View style={styles.infoCard}>
							<Ionicons
								name="shield-checkmark-outline"
								size={32}
								color={theme.colors.primary}
							/>
							<Text style={styles.infoTitle}>Genuine Parts</Text>
							<Text style={styles.infoText}>
								Over 45,000 genuine manufacturer parts
							</Text>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Appliance Selection Modal */}
			<ApplianceModal
				visible={isApplianceModalVisible}
				onClose={() => setIsApplianceModalVisible(false)}
				onSelect={handleApplianceSelect}
			/>
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
	heroSection: {
		marginBottom: theme.spacing.xl,
		alignItems: 'center',
	},
	heroLogo: {
		marginBottom: theme.spacing.md,
	},
	heroTitle: {
		...theme.typography.h1,
		textAlign: 'center',
		marginBottom: theme.spacing.sm,
		color: theme.colors.primary,
	},
	heroSubtitle: {
		...theme.typography.body,
		textAlign: 'center',
		color: theme.colors.textSecondary,
	},
	modeSelectorContainer: {
		marginBottom: theme.spacing.lg,
	},
	modeSelectorTitle: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		fontWeight: '600',
		marginBottom: theme.spacing.sm,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	modeSelector: {
		flexDirection: 'row',
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.xs,
		gap: theme.spacing.xs,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	modeButton: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.xs,
		borderRadius: theme.borderRadius.md,
		gap: theme.spacing.xs,
		minHeight: 70,
	},
	modeButtonActive: {
		backgroundColor: theme.colors.primary,
		...theme.shadows.md,
	},
	modeButtonText: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		fontWeight: '500',
		fontSize: 13,
	},
	modeButtonTextActive: {
		color: '#ffffff',
		fontWeight: '700',
		fontSize: 13,
	},
	searchSection: {
		marginBottom: theme.spacing.xl,
	},
	searchButton: {
		marginTop: theme.spacing.md,
	},
	quickLinksSection: {
		marginBottom: theme.spacing.xl,
	},
	sectionTitle: {
		...theme.typography.h3,
		marginBottom: theme.spacing.md,
	},
	quickLinks: {
		flexDirection: 'row',
		gap: theme.spacing.md,
	},
	quickLink: {
		flex: 1,
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.md,
		alignItems: 'center',
		...theme.shadows.sm,
	},
	quickLinkText: {
		...theme.typography.bodySmall,
		marginTop: theme.spacing.xs,
		fontWeight: '600',
		color: theme.colors.text,
	},
	manufacturersSection: {
		marginBottom: theme.spacing.xl,
	},
	manufacturersGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.sm,
	},
	manufacturerChip: {
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.full,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	manufacturerText: {
		...theme.typography.bodySmall,
		color: theme.colors.text,
		fontWeight: '500',
	},
	infoSection: {
		flexDirection: 'row',
		gap: theme.spacing.md,
	},
	infoCard: {
		flex: 1,
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.md,
		alignItems: 'center',
		...theme.shadows.sm,
	},
	infoTitle: {
		...theme.typography.h3,
		marginTop: theme.spacing.sm,
		marginBottom: theme.spacing.xs,
		textAlign: 'center',
	},
	infoText: {
		...theme.typography.bodySmall,
		textAlign: 'center',
		color: theme.colors.textSecondary,
	},
});
