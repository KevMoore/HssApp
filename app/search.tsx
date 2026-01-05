import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ActivityIndicator,
	RefreshControl,
	TouchableOpacity,
	Linking,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Part, PriceRangeFilter } from '../types';
import { PartCard } from '../components/parts/PartCard';
import { SearchBar } from '../components/ui/SearchBar';
import { SearchFilters } from '../components/ui/SearchFilters';
import { NoResultsModal } from '../components/ui/NoResultsModal';
import { theme } from '../constants/theme';
import { searchParts } from '../services/partsService';
import { saveSearchTerm } from '../services/searchHistoryService';

// Office phone number from about page
const OFFICE_PHONE = '01202 718660';

export default function SearchScreen() {
	const params = useLocalSearchParams<{ q?: string; mode?: string }>();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState(params.q || '');
	const [allParts, setAllParts] = useState<Part[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showNoResultsModal, setShowNoResultsModal] = useState(false);
	const [activeTab, setActiveTab] = useState<'inStock' | 'outOfStock'>(
		'inStock'
	);
	const [priceRange, setPriceRange] = useState<PriceRangeFilter>('all');

	const performSearch = useCallback(async (query: string) => {
		if (!query.trim()) {
			setAllParts([]);
			setShowNoResultsModal(false);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Fetch all results (both in-stock and out-of-stock)
			// We'll separate them client-side for the tabs
			const results = await searchParts({
				query,
				filters: {},
			});
			setAllParts(results);
			// Show modal if no results found and we have a search query
			if (results.length === 0 && query.trim()) {
				setShowNoResultsModal(true);
			} else {
				setShowNoResultsModal(false);
			}
		} catch (err) {
			setError('Failed to search parts. Please try again.');
			console.error('Search error:', err);
			setShowNoResultsModal(false);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (params.q) {
			const trimmedQuery = params.q.trim();
			// Save to search history when coming from navigation
			saveSearchTerm(
				trimmedQuery,
				(params.mode as 'appliance' | 'part' | 'keyword') || 'keyword'
			).catch((err) => {
				console.error('Error saving search term:', err);
			});
			performSearch(trimmedQuery);
		}
	}, [params.q, params.mode, performSearch]);

	const handleSearch = useCallback(async () => {
		if (searchQuery.trim()) {
			const trimmedQuery = searchQuery.trim();
			// Save to search history
			await saveSearchTerm(
				trimmedQuery,
				(params.mode as 'appliance' | 'part' | 'keyword') || 'keyword'
			);
			performSearch(trimmedQuery);
		}
	}, [searchQuery, performSearch, params.mode]);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		await performSearch(searchQuery.trim() || params.q || '');
		setRefreshing(false);
	}, [searchQuery, params.q, performSearch]);

	const handlePartPress = useCallback(
		(part: Part) => {
			router.push(`/product/${part.id}`);
		},
		[router]
	);

	// Separate parts into in-stock and out-of-stock
	const { inStockParts, outOfStockParts } = useMemo(() => {
		const inStock: Part[] = [];
		const outOfStock: Part[] = [];

		allParts.forEach((part) => {
			if (part.inStock) {
				inStock.push(part);
			} else {
				outOfStock.push(part);
			}
		});

		return { inStockParts: inStock, outOfStockParts: outOfStock };
	}, [allParts]);

	// Apply price range filter to the active tab's parts
	const filteredParts = useMemo(() => {
		const partsToFilter =
			activeTab === 'inStock' ? inStockParts : outOfStockParts;
		let filtered = [...partsToFilter];

		// Apply price range filter
		if (priceRange !== 'all' && filtered.length > 0) {
			filtered = filtered.filter((part) => {
				if (!part.price) return false;

				switch (priceRange) {
					case 'under10':
						return part.price < 10;
					case '10to25':
						return part.price >= 10 && part.price < 25;
					case '25to50':
						return part.price >= 25 && part.price < 50;
					case '50to100':
						return part.price >= 50 && part.price < 100;
					case '100to250':
						return part.price >= 100 && part.price < 250;
					case 'over250':
						return part.price >= 250;
					default:
						return true;
				}
			});
		}

		return filtered;
	}, [activeTab, inStockParts, outOfStockParts, priceRange]);

	const handlePriceRangeChange = useCallback((range: PriceRangeFilter) => {
		setPriceRange(range);
		// Price filtering is always client-side, no need to re-search
	}, []);

	const handleClearFilters = useCallback(() => {
		setPriceRange('all');
	}, []);

	const handleCallForStock = useCallback(() => {
		Linking.openURL(`tel:${OFFICE_PHONE.replace(/\s/g, '')}`);
	}, []);

	const renderEmptyState = () => {
		if (loading) {
			return (
				<View style={styles.emptyState}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.emptyStateText}>Searching for parts...</Text>
				</View>
			);
		}

		if (error) {
			return (
				<View style={styles.emptyState}>
					<Text style={styles.emptyStateError}>
						{typeof error === 'string' ? error : 'An error occurred'}
					</Text>
				</View>
			);
		}

		if (!searchQuery.trim()) {
			return (
				<View style={styles.emptyState}>
					<Text style={styles.emptyStateText}>
						Enter a search term to find parts
					</Text>
				</View>
			);
		}

		// Don't show empty state text when modal will be shown
		if (showNoResultsModal) {
			return null;
		}

		return (
			<View style={styles.emptyState}>
				<Text style={styles.emptyStateText}>No parts found</Text>
				<Text style={styles.emptyStateSubtext}>
					Try adjusting your search terms
				</Text>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			<View style={styles.searchContainer}>
				<View style={styles.searchBarWrapper}>
					<SearchBar
						value={searchQuery}
						onChangeText={(text) => {
							setSearchQuery(text);
							// Hide modal when user starts typing
							if (showNoResultsModal) {
								setShowNoResultsModal(false);
							}
						}}
						onClear={() => {
							setSearchQuery('');
							setAllParts([]);
							setShowNoResultsModal(false);
						}}
						placeholder="Search parts..."
						onSubmitEditing={handleSearch}
						onSuggestionSelect={async (suggestion) => {
							setSearchQuery(suggestion);
							// Immediately perform search with the selected suggestion
							const trimmedQuery = suggestion.trim();
							if (trimmedQuery) {
								await saveSearchTerm(
									trimmedQuery,
									(params.mode as 'appliance' | 'part' | 'keyword') || 'keyword'
								);
								performSearch(trimmedQuery);
							}
						}}
						returnKeyType="search"
						style={styles.searchBar}
					/>
					<TouchableOpacity
						style={[
							styles.searchButton,
							(!searchQuery.trim() || loading) && styles.searchButtonDisabled,
						]}
						onPress={handleSearch}
						disabled={!searchQuery.trim() || loading}
						activeOpacity={0.7}
					>
						{loading ? (
							<ActivityIndicator size="small" color={theme.colors.background} />
						) : (
							<Ionicons
								name="search"
								size={20}
								color={theme.colors.background}
							/>
						)}
					</TouchableOpacity>
				</View>
			</View>

			{allParts.length > 0 && (
				<>
					{/* Tabs */}
					<View style={styles.tabsContainer}>
						<TouchableOpacity
							style={[styles.tab, activeTab === 'inStock' && styles.tabActive]}
							onPress={() => setActiveTab('inStock')}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.tabText,
									activeTab === 'inStock' && styles.tabTextActive,
								]}
							>
								In Stock ({inStockParts.length})
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.tab,
								activeTab === 'outOfStock' && styles.tabActive,
							]}
							onPress={() => setActiveTab('outOfStock')}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.tabText,
									activeTab === 'outOfStock' && styles.tabTextActive,
								]}
							>
								Call for Stock ({outOfStockParts.length})
							</Text>
						</TouchableOpacity>
					</View>

					{/* Call for Stock Button (only shown in out-of-stock tab) */}
					{activeTab === 'outOfStock' && outOfStockParts.length > 0 && (
						<View style={styles.callForStockContainer}>
							<TouchableOpacity
								style={styles.callForStockButton}
								onPress={handleCallForStock}
								activeOpacity={0.7}
							>
								<Ionicons
									name="call"
									size={20}
									color={theme.colors.background}
								/>
								<Text style={styles.callForStockText}>
									Call for Stock: {OFFICE_PHONE}
								</Text>
							</TouchableOpacity>
						</View>
					)}

					{/* Price Range Filter */}
					<SearchFilters
						stockStatus="all"
						priceRange={priceRange}
						onStockStatusChange={() => {}}
						onPriceRangeChange={handlePriceRangeChange}
						onClearFilters={handleClearFilters}
						hideStockStatus={true}
					/>
				</>
			)}

			{filteredParts.length > 0 ? (
				<View style={styles.resultsHeader}>
					<Text style={styles.resultsCount}>
						{`${filteredParts.length} ${
							filteredParts.length === 1 ? 'result' : 'results'
						} found`}
					</Text>
				</View>
			) : allParts.length > 0 ? (
				<View style={styles.resultsHeader}>
					<Text style={styles.resultsCount}>No results match your filters</Text>
				</View>
			) : null}

			<View style={styles.listContainer}>
				<FlashList<Part>
					data={filteredParts}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<PartCard part={item} onPress={() => handlePartPress(item)} />
					)}
					contentContainerStyle={styles.list}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={handleRefresh}
							tintColor={theme.colors.primary}
						/>
					}
					ListEmptyComponent={renderEmptyState}
					showsVerticalScrollIndicator={false}
				/>
			</View>

			{/* No Results Modal */}
			<NoResultsModal
				isVisible={showNoResultsModal}
				searchQuery={searchQuery.trim() || params.q || ''}
				onDismiss={() => setShowNoResultsModal(false)}
				onTryAgain={() => {
					// Focus search bar or trigger search again
					handleSearch();
				}}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	searchContainer: {
		padding: theme.spacing.md,
		backgroundColor: theme.colors.surfaceElevated,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	searchBarWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.sm,
	},
	searchBar: {
		flex: 1,
	},
	searchButton: {
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.lg,
		width: 48,
		height: 48,
		justifyContent: 'center',
		alignItems: 'center',
	},
	searchButtonDisabled: {
		opacity: 0.5,
	},
	resultsHeader: {
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		backgroundColor: theme.colors.surface,
	},
	resultsCount: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
	},
	listContainer: {
		flex: 1,
	},
	list: {
		padding: theme.spacing.md,
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: theme.spacing.xl,
	},
	emptyStateText: {
		...theme.typography.h3,
		color: theme.colors.textSecondary,
		textAlign: 'center',
		marginTop: theme.spacing.md,
	},
	emptyStateSubtext: {
		...theme.typography.body,
		color: theme.colors.textLight,
		textAlign: 'center',
		marginTop: theme.spacing.sm,
	},
	emptyStateError: {
		...theme.typography.body,
		color: theme.colors.error,
		textAlign: 'center',
	},
	tabsContainer: {
		flexDirection: 'row',
		backgroundColor: theme.colors.surfaceElevated,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
		paddingHorizontal: theme.spacing.md,
	},
	tab: {
		flex: 1,
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.sm,
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
		alignItems: 'center',
	},
	tabActive: {
		borderBottomColor: theme.colors.primary,
	},
	tabText: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
		fontWeight: '500',
	},
	tabTextActive: {
		color: theme.colors.primary,
		fontWeight: '600',
	},
	callForStockContainer: {
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		backgroundColor: theme.colors.surface,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	callForStockButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: theme.colors.primary,
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.lg,
		borderRadius: theme.borderRadius.md,
		gap: theme.spacing.sm,
	},
	callForStockText: {
		...theme.typography.body,
		color: theme.colors.background,
		fontWeight: '600',
	},
});
