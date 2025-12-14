import React, { useCallback, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Image,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { theme } from '../../constants/theme';
import { useBasketStore } from '../../stores/basketStore';
import { Button } from '../../components/ui/Button';
import {
	getNextDayDeliveryCharge,
	getVatRate,
	calculateVat,
} from '../../utils/env';
import {
	syncBasketToCart,
	getCheckoutUrl,
} from '../../services/woocommerceCartService';

export default function BasketScreen() {
	const {
		items,
		itemCount,
		total,
		isLoading,
		loadBasket,
		updateQuantity,
		removeItem,
		clear,
	} = useBasketStore();
	const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

	useFocusEffect(
		useCallback(() => {
			loadBasket();
		}, [loadBasket])
	);

	const handleQuantityChange = async (partId: string, delta: number) => {
		const item = items.find((i) => i.id === partId);
		if (item) {
			const newQuantity = Math.max(0, item.quantity + delta);
			if (newQuantity === 0) {
				// Show confirmation when quantity reaches 0
				handleRemove(partId);
			} else {
				await updateQuantity(partId, newQuantity);
			}
		}
	};

	const handleRemove = (partId: string) => {
		const item = items.find((i) => i.id === partId);
		if (!item) return;

		Alert.alert(
			'Remove Item',
			`Are you sure you want to remove ${item.partNumber} from your basket?`,
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Remove',
					style: 'destructive',
					onPress: async () => {
						await removeItem(partId);
					},
				},
			],
			{ cancelable: true }
		);
	};

	const handleCheckout = async () => {
		try {
			setIsProcessingCheckout(true);

			// Check if local basket is empty
			if (!items || items.length === 0) {
				throw new Error(
					'Your basket is empty. Please add items before checkout.'
				);
			}

			console.log('[Checkout] Syncing basket to WooCommerce cart...', {
				itemCount: items.length,
			});

			// Sync local basket to WooCommerce cart
			const cart = await syncBasketToCart(items);

			console.log('[Checkout] Basket synced to cart:', {
				cartItemCount: cart.items.length,
				totalPrice: cart.totals.total_price,
			});

			// Clear local basket after successful sync
			await clear();

			console.log('[Checkout] Local basket cleared');

			// Get checkout bridge URL with cart token and open it
			// The checkout bridge will transfer the cart to web session and redirect to checkout
			const checkoutUrl = await getCheckoutUrl();
			console.log('[Checkout] Opening checkout bridge URL:', checkoutUrl);

			const supported = await Linking.canOpenURL(checkoutUrl);
			if (supported) {
				await Linking.openURL(checkoutUrl);
			} else {
				throw new Error(`Cannot open checkout URL: ${checkoutUrl}`);
			}
		} catch (error) {
			console.error('Error processing checkout:', error);
			Alert.alert(
				'Error',
				error instanceof Error
					? error.message
					: 'Failed to process checkout. Please try again.',
				[
					{
						text: 'OK',
					},
				]
			);
		} finally {
			setIsProcessingCheckout(false);
		}
	};

	const renderBasketItem = ({ item }: { item: (typeof items)[0] }) => {
		const itemTotal = (item.price ?? 0) * item.quantity;

		return (
			<View key={item.id} style={styles.basketItem}>
				{item.imageUrl && (
					<Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
				)}
				<View style={styles.itemContent}>
					<View style={styles.itemHeader}>
						<View style={styles.itemInfo}>
							<Text style={styles.itemPartNumber}>{item.partNumber}</Text>
							<Text style={styles.itemName} numberOfLines={2}>
								{item.name}
							</Text>
							<Text style={styles.itemManufacturer}>{item.manufacturer}</Text>
						</View>
						<TouchableOpacity
							style={styles.removeButton}
							onPress={() => handleRemove(item.id)}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Ionicons
								name="close-circle"
								size={24}
								color={theme.colors.error}
							/>
						</TouchableOpacity>
					</View>

					<View style={styles.itemFooter}>
						<View style={styles.quantityContainer}>
							<TouchableOpacity
								style={[
									styles.quantityButton,
									item.quantity <= 1 && styles.quantityButtonDisabled,
								]}
								onPress={() => handleQuantityChange(item.id, -1)}
								disabled={item.quantity <= 1}
							>
								<Ionicons
									name="remove"
									size={18}
									color={
										item.quantity <= 1
											? theme.colors.textLight
											: theme.colors.text
									}
								/>
							</TouchableOpacity>
							<Text style={styles.quantityValue}>{item.quantity}</Text>
							<TouchableOpacity
								style={styles.quantityButton}
								onPress={() => handleQuantityChange(item.id, 1)}
							>
								<Ionicons name="add" size={18} color={theme.colors.text} />
							</TouchableOpacity>
						</View>
						<View style={styles.priceContainer}>
							{item.price ? (
								<>
									<Text style={styles.itemPrice}>£{itemTotal.toFixed(2)}</Text>
									<Text style={styles.itemPriceUnit}>
										£{item.price.toFixed(2)} each
									</Text>
								</>
							) : (
								<Text style={styles.itemPriceUnavailable}>
									Price on request
								</Text>
							)}
						</View>
					</View>
				</View>
			</View>
		);
	};

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container} edges={['top']}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.loadingText}>Loading basket...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (items.length === 0) {
		return (
			<SafeAreaView style={styles.container} edges={['top']}>
				<ScrollView
					contentContainerStyle={styles.emptyContainer}
					showsVerticalScrollIndicator={false}
				>
					<Ionicons
						name="basket-outline"
						size={80}
						color={theme.colors.textLight}
					/>
					<Text style={styles.emptyTitle}>Your basket is empty</Text>
					<Text style={styles.emptySubtitle}>
						Add items from search results to get started
					</Text>
				</ScrollView>
			</SafeAreaView>
		);
	}

	// Calculate delivery and VAT
	const deliveryCharge = getNextDayDeliveryCharge();
	const vatRate = getVatRate();
	const subtotalWithDelivery = total + deliveryCharge;
	const vatAmount = calculateVat(subtotalWithDelivery);
	const grandTotal = subtotalWithDelivery + vatAmount;

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Text style={styles.title}>Shopping Basket</Text>
					<Text style={styles.subtitle}>
						{itemCount} {itemCount === 1 ? 'item' : 'items'}
					</Text>
				</View>

				<View style={styles.itemsContainer}>
					{items.map((item) => renderBasketItem({ item }))}
				</View>

				<View style={styles.footer}>
					<View style={styles.summary}>
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>Subtotal</Text>
							<Text style={styles.summaryValue}>
								{total > 0 ? `£${total.toFixed(2)}` : '—'}
							</Text>
						</View>
						{total > 0 && (
							<>
								<View style={styles.summaryRow}>
									<Text style={styles.summaryLabel}>Next Day Delivery</Text>
									<Text style={styles.summaryValue}>
										£{deliveryCharge.toFixed(2)}
									</Text>
								</View>
								<View style={styles.summaryRow}>
									<Text style={styles.summaryLabel}>VAT ({vatRate}%)</Text>
									<Text style={styles.summaryValue}>
										£{vatAmount.toFixed(2)}
									</Text>
								</View>
							</>
						)}
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>Items</Text>
							<Text style={styles.summaryValue}>{itemCount}</Text>
						</View>
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>Total</Text>
							<Text style={styles.totalValue}>
								{total > 0 ? `£${grandTotal.toFixed(2)}` : '—'}
							</Text>
						</View>
					</View>

					<Button
						title={isProcessingCheckout ? 'Processing...' : 'Checkout'}
						onPress={handleCheckout}
						variant="primary"
						size="large"
						style={styles.checkoutButton}
						disabled={isProcessingCheckout}
						loading={isProcessingCheckout}
					/>

					<Text style={styles.checkoutNote}>
						Prices include VAT and next day delivery charge.
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
	header: {
		padding: theme.spacing.md,
		backgroundColor: theme.colors.surfaceElevated,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	title: {
		...theme.typography.h1,
		color: theme.colors.primary,
		marginBottom: theme.spacing.xs,
	},
	subtitle: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: theme.spacing.xl,
	},
	emptyTitle: {
		...theme.typography.h2,
		color: theme.colors.text,
		marginTop: theme.spacing.lg,
		marginBottom: theme.spacing.sm,
	},
	emptySubtitle: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
		textAlign: 'center',
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		paddingBottom: theme.spacing.md,
	},
	itemsContainer: {
		padding: theme.spacing.md,
	},
	basketItem: {
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		flexDirection: 'row',
		...theme.shadows.md,
	},
	itemImage: {
		width: 80,
		height: 80,
		borderRadius: theme.borderRadius.md,
		backgroundColor: theme.colors.surface,
		marginRight: theme.spacing.md,
	},
	itemContent: {
		flex: 1,
	},
	itemHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: theme.spacing.sm,
	},
	itemInfo: {
		flex: 1,
	},
	itemPartNumber: {
		...theme.typography.body,
		fontWeight: '600',
		color: theme.colors.primary,
		marginBottom: theme.spacing.xs,
	},
	itemName: {
		...theme.typography.body,
		color: theme.colors.text,
		marginBottom: theme.spacing.xs,
	},
	itemManufacturer: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
	},
	removeButton: {
		padding: theme.spacing.xs,
	},
	itemFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: theme.spacing.sm,
	},
	quantityContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.md,
		paddingHorizontal: theme.spacing.xs,
	},
	quantityButton: {
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
	},
	quantityButtonDisabled: {
		opacity: 0.3,
	},
	quantityValue: {
		...theme.typography.body,
		fontWeight: '600',
		minWidth: 30,
		textAlign: 'center',
		color: theme.colors.text,
	},
	priceContainer: {
		alignItems: 'flex-end',
	},
	itemPrice: {
		...theme.typography.h3,
		color: theme.colors.primary,
		fontWeight: '700',
	},
	itemPriceUnit: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
		marginTop: theme.spacing.xs / 2,
	},
	itemPriceUnavailable: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		fontStyle: 'italic',
	},
	footer: {
		backgroundColor: theme.colors.surfaceElevated,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
		padding: theme.spacing.md,
		...theme.shadows.lg,
	},
	summary: {
		marginBottom: theme.spacing.md,
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: theme.spacing.sm,
	},
	summaryLabel: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
	},
	summaryValue: {
		...theme.typography.body,
		fontWeight: '600',
		color: theme.colors.text,
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: theme.spacing.sm,
		paddingTop: theme.spacing.md,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	totalLabel: {
		...theme.typography.h3,
		color: theme.colors.text,
		fontWeight: '700',
	},
	totalValue: {
		...theme.typography.h2,
		color: theme.colors.primary,
		fontWeight: '700',
	},
	checkoutButton: {
		marginBottom: theme.spacing.sm,
	},
	checkoutNote: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
		textAlign: 'center',
		marginTop: theme.spacing.xs,
	},
});
