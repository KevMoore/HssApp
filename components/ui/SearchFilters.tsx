import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { StockStatusFilter, PriceRangeFilter } from '../../types';

interface SearchFiltersProps {
	stockStatus: StockStatusFilter;
	priceRange: PriceRangeFilter;
	onStockStatusChange: (status: StockStatusFilter) => void;
	onPriceRangeChange: (range: PriceRangeFilter) => void;
	onClearFilters: () => void;
}

const STOCK_STATUS_OPTIONS: { value: StockStatusFilter; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'inStock', label: 'In Stock' },
	{ value: 'outOfStock', label: 'Out of Stock' },
];

const PRICE_RANGE_OPTIONS: { value: PriceRangeFilter; label: string }[] = [
	{ value: 'all', label: 'All Prices' },
	{ value: 'under10', label: 'Under £10' },
	{ value: '10to25', label: '£10 - £25' },
	{ value: '25to50', label: '£25 - £50' },
	{ value: '50to100', label: '£50 - £100' },
	{ value: '100to250', label: '£100 - £250' },
	{ value: 'over250', label: 'Over £250' },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
	stockStatus,
	priceRange,
	onStockStatusChange,
	onPriceRangeChange,
	onClearFilters,
}) => {
	const [isModalVisible, setIsModalVisible] = useState(false);
	const insets = useSafeAreaInsets();
	const hasActiveFilters = stockStatus !== 'all' || priceRange !== 'all';

	const handleClearFilters = () => {
		onStockStatusChange('all');
		onPriceRangeChange('all');
		onClearFilters();
	};

	return (
		<>
			<View style={styles.container}>
				<TouchableOpacity
					style={styles.filterButton}
					onPress={() => setIsModalVisible(true)}
					activeOpacity={0.7}
				>
					<Ionicons
						name="filter"
						size={18}
						color={hasActiveFilters ? theme.colors.primary : theme.colors.textSecondary}
					/>
					<Text
						style={[
							styles.filterButtonText,
							hasActiveFilters && styles.filterButtonTextActive,
						]}
					>
						Filters
					</Text>
					{hasActiveFilters && (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>
								{(stockStatus !== 'all' ? 1 : 0) + (priceRange !== 'all' ? 1 : 0)}
							</Text>
						</View>
					)}
				</TouchableOpacity>

				{hasActiveFilters && (
					<TouchableOpacity
						style={styles.clearButton}
						onPress={handleClearFilters}
						activeOpacity={0.7}
					>
						<Ionicons name="close-circle" size={18} color={theme.colors.error} />
						<Text style={styles.clearButtonText}>Clear</Text>
					</TouchableOpacity>
				)}
			</View>

			<Modal
				visible={isModalVisible}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setIsModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<SafeAreaView 
						style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, theme.spacing.lg) }]} 
						edges={['bottom']}
					>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Filter Results</Text>
							<TouchableOpacity
								onPress={() => setIsModalVisible(false)}
								activeOpacity={0.7}
							>
								<Ionicons
									name="close"
									size={24}
									color={theme.colors.text}
								/>
							</TouchableOpacity>
						</View>

						<ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
							{/* Stock Status Filter */}
							<View style={styles.filterSection}>
								<Text style={styles.filterSectionTitle}>Stock Status</Text>
								<View style={styles.optionsContainer}>
									{STOCK_STATUS_OPTIONS.map((option) => (
										<TouchableOpacity
											key={option.value}
											style={[
												styles.optionButton,
												stockStatus === option.value && styles.optionButtonActive,
											]}
											onPress={() => onStockStatusChange(option.value)}
											activeOpacity={0.7}
										>
											<Text
												style={[
													styles.optionText,
													stockStatus === option.value && styles.optionTextActive,
												]}
											>
												{option.label}
											</Text>
											{stockStatus === option.value && (
												<Ionicons
													name="checkmark"
													size={18}
													color={theme.colors.primary}
												/>
											)}
										</TouchableOpacity>
									))}
								</View>
							</View>

							{/* Price Range Filter */}
							<View style={styles.filterSection}>
								<Text style={styles.filterSectionTitle}>Price Range</Text>
								<View style={styles.optionsContainer}>
									{PRICE_RANGE_OPTIONS.map((option) => (
										<TouchableOpacity
											key={option.value}
											style={[
												styles.optionButton,
												priceRange === option.value && styles.optionButtonActive,
											]}
											onPress={() => onPriceRangeChange(option.value)}
											activeOpacity={0.7}
										>
											<Text
												style={[
													styles.optionText,
													priceRange === option.value && styles.optionTextActive,
												]}
											>
												{option.label}
											</Text>
											{priceRange === option.value && (
												<Ionicons
													name="checkmark"
													size={18}
													color={theme.colors.primary}
												/>
											)}
										</TouchableOpacity>
									))}
								</View>
							</View>
						</ScrollView>

						<View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
							<TouchableOpacity
								style={styles.clearAllButton}
								onPress={handleClearFilters}
								activeOpacity={0.7}
							>
								<Text style={styles.clearAllButtonText}>Clear All</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.applyButton}
								onPress={() => setIsModalVisible(false)}
								activeOpacity={0.7}
							>
								<Text style={styles.applyButtonText}>Apply Filters</Text>
							</TouchableOpacity>
						</View>
					</SafeAreaView>
				</View>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.sm,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		backgroundColor: theme.colors.surface,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	filterButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.xs,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		position: 'relative',
	},
	filterButtonText: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		fontWeight: '500',
	},
	filterButtonTextActive: {
		color: theme.colors.primary,
		fontWeight: '600',
	},
	badge: {
		position: 'absolute',
		top: -4,
		right: -4,
		backgroundColor: theme.colors.error,
		borderRadius: 10,
		minWidth: 20,
		height: 20,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 4,
		borderWidth: 2,
		borderColor: theme.colors.background,
	},
	badgeText: {
		...theme.typography.caption,
		color: theme.colors.background,
		fontWeight: '700',
		fontSize: 10,
	},
	clearButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.xs,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.sm,
	},
	clearButtonText: {
		...theme.typography.bodySmall,
		color: theme.colors.error,
		fontWeight: '500',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: theme.colors.background,
		borderTopLeftRadius: theme.borderRadius.xl,
		borderTopRightRadius: theme.borderRadius.xl,
		maxHeight: '85%',
		...theme.shadows.lg,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	modalTitle: {
		...theme.typography.h2,
		color: theme.colors.text,
	},
	modalBody: {
		flex: 1,
		padding: theme.spacing.md,
	},
	filterSection: {
		marginBottom: theme.spacing.xl,
	},
	filterSectionTitle: {
		...theme.typography.h3,
		color: theme.colors.text,
		marginBottom: theme.spacing.md,
	},
	optionsContainer: {
		gap: theme.spacing.sm,
	},
	optionButton: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: theme.spacing.md,
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.md,
		borderWidth: 2,
		borderColor: theme.colors.border,
	},
	optionButtonActive: {
		backgroundColor: theme.colors.primaryLight + '15',
		borderColor: theme.colors.primary,
	},
	optionText: {
		...theme.typography.body,
		color: theme.colors.text,
	},
	optionTextActive: {
		color: theme.colors.primary,
		fontWeight: '600',
	},
	modalFooter: {
		flexDirection: 'row',
		gap: theme.spacing.md,
		padding: theme.spacing.md,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	clearAllButton: {
		flex: 1,
		padding: theme.spacing.md,
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		alignItems: 'center',
	},
	clearAllButtonText: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
		fontWeight: '600',
	},
	applyButton: {
		flex: 1,
		padding: theme.spacing.md,
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.md,
		alignItems: 'center',
	},
	applyButtonText: {
		...theme.typography.body,
		color: theme.colors.background,
		fontWeight: '600',
	},
});

