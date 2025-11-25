import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Image,
	ActivityIndicator,
	TouchableOpacity,
	Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Part } from '../../types';
import { getPartById, searchParts } from '../../services/partsService';
import { theme } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { openPartPage } from '../../utils/linking';
import { useBasketStore } from '../../stores/basketStore';

export default function ProductDetailsScreen() {
	const params = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const [part, setPart] = useState<Part | null>(null);
	const [relatedParts, setRelatedParts] = useState<Part[]>([]);
	const [loading, setLoading] = useState(true);
	const [quantity, setQuantity] = useState(1);
	const [compatibilityExpanded, setCompatibilityExpanded] = useState(true);
	const [isAdding, setIsAdding] = useState(false);
	const addItem = useBasketStore((state) => state.addItem);
	const refreshCount = useBasketStore((state) => state.refreshCount);

	useEffect(() => {
		const loadPart = async () => {
			if (!params.id) {
				return;
			}

			setLoading(true);
			try {
				const partData = await getPartById(params.id);
				setPart(partData);

				// Load related parts (same manufacturer or category)
				if (partData) {
					const related = await searchParts({
						query: partData.manufacturer,
						filters: {
							category: partData.category,
						},
					});
					// Filter out the current part and limit to 5
					setRelatedParts(
						related.filter((p) => p.id !== partData.id).slice(0, 5)
					);
				}
			} catch (error) {
				console.error('Error loading part:', error);
			} finally {
				setLoading(false);
			}
		};

		loadPart();
	}, [params.id]);

	const handleAddToBasket = async () => {
		if (!part) return;

		if (!part.inStock) {
			Alert.alert('Out of Stock', 'This item is currently out of stock.');
			return;
		}

		setIsAdding(true);
		try {
			await addItem(part, quantity);
			await refreshCount();
			Alert.alert(
				'Added to Basket',
				`${quantity} x ${part.partNumber} has been added to your basket.`,
				[
					{
						text: 'Continue Shopping',
						style: 'cancel',
						onPress: () => {
							// Just dismiss modals, stay on current screen
							router.dismissAll();
						},
					},
					{
						text: 'Go To Basket',
						onPress: () => {
							// Navigate to basket tab
							router.dismissAll();
							router.replace('/(tabs)/basket');
						},
					},
				]
			);
		} catch (error) {
			console.error('Error adding to basket:', error);
			Alert.alert('Error', 'Failed to add item to basket. Please try again.');
		} finally {
			setIsAdding(false);
		}
	};

	const handleQuantityChange = (delta: number) => {
		setQuantity(Math.max(1, quantity + delta));
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.container} edges={['top']}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.loadingText}>Loading product details...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!part) {
		return (
			<SafeAreaView style={styles.container} edges={['top']}>
				<View style={styles.errorContainer}>
					<Ionicons
						name="alert-circle-outline"
						size={48}
						color={theme.colors.error}
					/>
					<Text style={styles.errorText}>Product not found</Text>
					<Button
						title="Go Back"
						onPress={() => router.back()}
						variant="primary"
						style={styles.backButton}
					/>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Product Image */}
				{part.imageUrl && (
					<View style={styles.imageContainer}>
						<Image
							source={{ uri: part.imageUrl }}
							style={styles.image}
							resizeMode="contain"
						/>
					</View>
				)}

				{/* Product Info */}
				<View style={styles.content}>
					{/* Breadcrumb */}
					<View style={styles.breadcrumb}>
						<Text style={styles.breadcrumbText}>Home</Text>
						<Ionicons
							name="chevron-forward"
							size={16}
							color={theme.colors.textSecondary}
						/>
						<Text style={styles.breadcrumbText}>{part.manufacturer}</Text>
						<Ionicons
							name="chevron-forward"
							size={16}
							color={theme.colors.textSecondary}
						/>
						<Text style={styles.breadcrumbText}>{part.partNumber}</Text>
					</View>

					{/* Part Number */}
					<Text style={styles.partNumber}>{part.partNumber}</Text>

					{/* Product Name */}
					<Text style={styles.productName}>{part.name}</Text>

					{/* SKU */}
					<View style={styles.skuContainer}>
						<Text style={styles.skuLabel}>SKU:</Text>
						<Text style={styles.skuValue}>
							{part.manufacturer.toUpperCase()}-{part.partNumber}
						</Text>
					</View>

					{/* Description */}
					{part.description && (
						<Text style={styles.description}>{part.description}</Text>
					)}

					{/* Compatibility */}
					{part.compatibleWith && part.compatibleWith.length > 0 && (
						<View style={styles.compatibilitySection}>
							<TouchableOpacity
								style={styles.compatibilityHeader}
								onPress={() => setCompatibilityExpanded(!compatibilityExpanded)}
								activeOpacity={0.7}
							>
								<Text style={styles.compatibilityTitle}>Parts Also Fits</Text>
								<Ionicons
									name={compatibilityExpanded ? 'chevron-up' : 'chevron-down'}
									size={20}
									color={theme.colors.textSecondary}
								/>
							</TouchableOpacity>
							{compatibilityExpanded && (
								<Text style={styles.compatibilityList}>
									{part.compatibleWith.join(', ')}
								</Text>
							)}
						</View>
					)}

					{/* Price and Stock */}
					<View style={styles.priceStockContainer}>
						<View style={styles.priceContainer}>
							{part.price && (
								<>
									<Text style={styles.priceLabel}>
										£{part.price.toFixed(2)}
									</Text>
									<Text style={styles.priceNote}>(ex VAT)</Text>
								</>
							)}
						</View>
						<View style={styles.stockContainer}>
							<View
								style={[
									styles.stockIndicator,
									part.inStock ? styles.stockIn : styles.stockOut,
								]}
							/>
							<Text
								style={[
									styles.stockText,
									part.inStock ? styles.stockTextIn : styles.stockTextOut,
								]}
							>
								{part.inStock ? 'In Stock' : 'Out of Stock'}
							</Text>
						</View>
					</View>

					{/* Quantity Selector */}
					<View style={styles.quantityContainer}>
						<Text style={styles.quantityLabel}>Quantity</Text>
						<View style={styles.quantityControls}>
							<TouchableOpacity
								style={styles.quantityButton}
								onPress={() => handleQuantityChange(-1)}
								disabled={quantity <= 1}
							>
								<Ionicons
									name="remove"
									size={20}
									color={
										quantity <= 1 ? theme.colors.textLight : theme.colors.text
									}
								/>
							</TouchableOpacity>
							<Text style={styles.quantityValue}>{quantity}</Text>
							<TouchableOpacity
								style={styles.quantityButton}
								onPress={() => handleQuantityChange(1)}
							>
								<Ionicons name="add" size={20} color={theme.colors.text} />
							</TouchableOpacity>
						</View>
					</View>

					{/* Add to Basket Button */}
					<Button
						title={isAdding ? 'Adding...' : 'Add to Basket'}
						onPress={handleAddToBasket}
						variant="primary"
						size="large"
						style={styles.addToBasketButton}
						disabled={!part.inStock || isAdding}
						loading={isAdding}
					/>

					{/* Shipping Info */}
					<View style={styles.shippingInfo}>
						<Text style={styles.shippingText}>
							All orders placed <Text style={styles.bold}>after 3pm</Text> will
							be processed the next working day (Monday to Friday except bank
							holidays).
						</Text>
						<Text style={styles.shippingText}>
							Order before 3pm for next day delivery or collection
						</Text>
						<Text style={styles.shippingText}>
							Click & Collect from Poole, Salisbury or Southampton
						</Text>
					</View>

					{/* Trade Customer Notice */}
					<View style={styles.tradeNotice}>
						<Text style={styles.tradeText}>
							Trade Customer? Sign-up or login for discounted trade pricing.
						</Text>
					</View>

					{/* Related Parts */}
					{relatedParts.length > 0 && (
						<View style={styles.relatedSection}>
							<Text style={styles.relatedTitle}>You May Also Like:</Text>
							{relatedParts.map((relatedPart) => (
								<TouchableOpacity
									key={relatedPart.id}
									style={styles.relatedItem}
									onPress={() => {
										router.replace(`/product/${relatedPart.id}`);
									}}
								>
									<Text style={styles.relatedPartNumber}>
										{relatedPart.partNumber}
									</Text>
									<Text style={styles.relatedPartName}>{relatedPart.name}</Text>
									{!relatedPart.inStock && (
										<Text style={styles.relatedStockNote}>
											Please call for stock availability: 01202 718660
										</Text>
									)}
								</TouchableOpacity>
							))}
						</View>
					)}
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
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: theme.spacing.xl,
	},
	loadingText: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
		marginTop: theme.spacing.md,
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: theme.spacing.xl,
	},
	errorText: {
		...theme.typography.h3,
		color: theme.colors.error,
		marginTop: theme.spacing.md,
		marginBottom: theme.spacing.lg,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: theme.spacing.xl,
	},
	imageContainer: {
		width: '100%',
		height: 300,
		backgroundColor: theme.colors.surface,
		marginBottom: theme.spacing.md,
		padding: theme.spacing.md,
	},
	image: {
		width: '100%',
		height: '100%',
	},
	content: {
		padding: theme.spacing.md,
	},
	breadcrumb: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: theme.spacing.md,
		gap: theme.spacing.xs,
	},
	breadcrumbText: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
	},
	partNumber: {
		...theme.typography.h2,
		color: theme.colors.primary,
		marginBottom: theme.spacing.xs,
	},
	productName: {
		...theme.typography.h1,
		marginBottom: theme.spacing.md,
	},
	skuContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: theme.spacing.md,
		gap: theme.spacing.xs,
	},
	skuLabel: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		fontWeight: '600',
	},
	skuValue: {
		...theme.typography.bodySmall,
		color: theme.colors.text,
		fontWeight: '600',
	},
	description: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.lg,
		lineHeight: 24,
	},
	priceStockContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: theme.spacing.lg,
		paddingBottom: theme.spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	priceContainer: {
		flex: 1,
	},
	priceLabel: {
		...theme.typography.h1,
		color: theme.colors.primary,
	},
	priceNote: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		marginTop: theme.spacing.xs,
	},
	stockContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderRadius: theme.borderRadius.md,
		backgroundColor: theme.colors.surface,
	},
	stockIndicator: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginRight: theme.spacing.xs,
	},
	stockIn: {
		backgroundColor: theme.colors.success,
	},
	stockOut: {
		backgroundColor: theme.colors.error,
	},
	stockText: {
		...theme.typography.bodySmall,
		fontWeight: '600',
	},
	stockTextIn: {
		color: theme.colors.success,
	},
	stockTextOut: {
		color: theme.colors.error,
	},
	quantityContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: theme.spacing.lg,
		padding: theme.spacing.md,
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.md,
	},
	quantityLabel: {
		...theme.typography.body,
		fontWeight: '600',
		color: theme.colors.text,
	},
	quantityControls: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.md,
	},
	quantityButton: {
		width: 36,
		height: 36,
		borderRadius: theme.borderRadius.md,
		backgroundColor: theme.colors.surfaceElevated,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	quantityValue: {
		...theme.typography.h3,
		minWidth: 40,
		textAlign: 'center',
	},
	addToBasketButton: {
		marginBottom: theme.spacing.lg,
	},
	shippingInfo: {
		backgroundColor: theme.colors.surface,
		padding: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
		marginBottom: theme.spacing.lg,
	},
	shippingText: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.xs,
		lineHeight: 20,
	},
	bold: {
		fontWeight: '700',
	},
	tradeNotice: {
		backgroundColor: theme.colors.surfaceElevated,
		padding: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
		marginBottom: theme.spacing.lg,
		borderLeftWidth: 3,
		borderLeftColor: theme.colors.primary,
	},
	tradeText: {
		...theme.typography.bodySmall,
		color: theme.colors.text,
	},
	relatedSection: {
		marginTop: theme.spacing.lg,
		paddingTop: theme.spacing.lg,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	relatedTitle: {
		...theme.typography.h3,
		marginBottom: theme.spacing.md,
	},
	relatedItem: {
		padding: theme.spacing.md,
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.md,
		marginBottom: theme.spacing.sm,
	},
	relatedPartNumber: {
		...theme.typography.body,
		fontWeight: '600',
		color: theme.colors.primary,
		marginBottom: theme.spacing.xs,
	},
	relatedPartName: {
		...theme.typography.bodySmall,
		color: theme.colors.text,
		marginBottom: theme.spacing.xs,
	},
	relatedStockNote: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
		fontStyle: 'italic',
	},
	compatibilitySection: {
		marginBottom: theme.spacing.lg,
		padding: theme.spacing.md,
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.md,
	},
	compatibilityHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: theme.spacing.sm,
	},
	compatibilityTitle: {
		...theme.typography.body,
		fontWeight: '600',
		color: theme.colors.text,
	},
	compatibilityList: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		lineHeight: 22,
	},
});
