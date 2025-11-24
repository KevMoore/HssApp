import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ActivityIndicator,
	RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Part } from '../types';
import { PartCard } from '../components/parts/PartCard';
import { SearchBar } from '../components/ui/SearchBar';
import { theme } from '../constants/theme';
import { searchParts } from '../services/partsService';
import { saveSearchTerm } from '../services/searchHistoryService';

export default function SearchScreen() {
	const params = useLocalSearchParams<{ q?: string; mode?: string }>();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState(params.q || '');
	const [parts, setParts] = useState<Part[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const performSearch = useCallback(async (query: string) => {
		if (!query.trim()) {
			setParts([]);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const results = await searchParts({
				query,
				filters: {},
			});
			setParts(results);
		} catch (err) {
			setError('Failed to search parts. Please try again.');
			console.error('Search error:', err);
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

	const handlePartPress = useCallback((part: Part) => {
		// Could navigate to a detail screen in the future
		console.log('Part pressed:', part);
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
					<Text style={styles.emptyStateError}>{error}</Text>
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
				<SearchBar
					value={searchQuery}
					onChangeText={setSearchQuery}
					onClear={() => {
						setSearchQuery('');
						setParts([]);
					}}
					placeholder="Search parts..."
					onSubmitEditing={handleSearch}
					returnKeyType="search"
				/>
			</View>

			{parts.length > 0 && (
				<View style={styles.resultsHeader}>
					<Text style={styles.resultsCount}>
						{parts.length} {parts.length === 1 ? 'result' : 'results'} found
					</Text>
				</View>
			)}

			<View style={styles.listContainer}>
				<FlashList<Part>
					data={parts}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<PartCard part={item} onPress={() => handlePartPress(item)} />
					)}
					estimatedItemSize={200}
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
