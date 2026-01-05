import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ActivityIndicator,
	RefreshControl,
	TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Part, StockStatusFilter, PriceRangeFilter } from '../types';
import { PartCard } from '../components/parts/PartCard';
import { SearchBar } from '../components/ui/SearchBar';
import { SearchFilters } from '../components/ui/SearchFilters';
import { NoResultsModal } from '../components/ui/NoResultsModal';
import { theme } from '../constants/theme';
import { searchParts } from '../services/partsService';
import { saveSearchTerm } from '../services/searchHistoryService';

export default function SearchScreen() {
	const params = useLocalSearchParams<{ q?: string; mode?: string }>();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState(params.q || '');
	const [allParts, setAllParts] = useState<Part[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showNoResultsModal, setShowNoResultsModal] = useState(false);
	const [stockStatus, setStockStatus] = useState<StockStatusFilter>('all');
	const [priceRange, setPriceRange] = useState<PriceRangeFilter>('all');

	const performSearch = useCallback(async (query: string, currentStockStatus?: StockStatusFilter) => {
		if (!query.trim()) {
			setAllParts([]);
			setShowNoResultsModal(false);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Use provided stockStatus or current state
			const statusToUse = currentStockStatus ?? stockStatus;
			
			// Convert stockStatus filter to the old inStockOnly format for API
			// Only use API filter for 'inStock' to optimize performance
			const filters: { inStockOnly?: boolean } = {};
			if (statusToUse === 'inStock') {
				filters.inStockOnly = true;
			}
			// For 'outOfStock' and 'all', we'll filter client-side

			const results = await searchParts({
				query,
				filters: filters.inStockOnly ? { inStockOnly: filters.inStockOnly } : {},
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
	}, [stockStatus]);

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

	// Apply client-side filters (stock status and price range)
	const filteredParts = useMemo(() => {
		let filtered = [...allParts];

		// Apply stock status filter
		if (stockStatus === 'inStock') {
			filtered = filtered.filter((part) => part.inStock);
		} else if (stockStatus === 'outOfStock') {
			filtered = filtered.filter((part) => !part.inStock);
		}

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
	}, [allParts, stockStatus, priceRange]);

	const handleStockStatusChange = useCallback((status: StockStatusFilter) => {
		setStockStatus(status);
		// If changing to 'inStock', re-search with API filter for better performance
		// Otherwise, client-side filtering will handle it
		if (status === 'inStock' && searchQuery.trim() && allParts.length > 0) {
			performSearch(searchQuery.trim(), status);
		}
	}, [searchQuery, allParts.length, performSearch]);

	const handlePriceRangeChange = useCallback((range: PriceRangeFilter) => {
		setPriceRange(range);
		// Price filtering is always client-side, no need to re-search
	}, []);

	const handleClearFilters = useCallback(() => {
		setStockStatus('all');
		setPriceRange('all');
		// If we had 'inStock' filter active, re-search to get all results
		if (searchQuery.trim() && allParts.length > 0) {
			performSearch(searchQuery.trim(), 'all');
		}
	}, [searchQuery, allParts.length, performSearch]);

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
							setParts([]);
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
				<SearchFilters
					stockStatus={stockStatus}
					priceRange={priceRange}
					onStockStatusChange={handleStockStatusChange}
					onPriceRangeChange={handlePriceRangeChange}
					onClearFilters={handleClearFilters}
				/>
			)}

			{filteredParts.length > 0 ? (
				<View style={styles.resultsHeader}>
					<Text style={styles.resultsCount}>
						{`${filteredParts.length} ${filteredParts.length === 1 ? 'result' : 'results'} found`}
					</Text>
				</View>
			) : allParts.length > 0 ? (
				<View style={styles.resultsHeader}>
					<Text style={styles.resultsCount}>
						No results match your filters
					</Text>
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
});
