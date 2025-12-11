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
	Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { theme } from '../../constants/theme';
import { useBasketStore } from '../../stores/basketStore';
import { Button } from '../../components/ui/Button';
import {
	getNextDayDeliveryCharge,
	getVatRate,
	calculateVat,
} from '../../utils/env';
import {
	createOrder,
	updateOrder,
	WooCommerceOrder,
	WooCommerceOrderBilling,
} from '../../services/woocommerceOrdersService';
import { useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import {
	initializePaymentSheetHelper,
	presentPaymentSheetHelper,
} from '../../services/stripeService';
import {
	BillingAddressForm,
	BillingAddress,
} from '../../components/checkout/BillingAddressForm';

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
	const [showBillingForm, setShowBillingForm] = useState(false);
	const [pendingOrder, setPendingOrder] = useState<WooCommerceOrder | null>(
		null
	);
	const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(
		null
	);
	const router = useRouter();
	const { initPaymentSheet, presentPaymentSheet } = useStripe();

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

			// Calculate total for Stripe (in pence)
			const deliveryCharge = getNextDayDeliveryCharge();
			const subtotalWithDelivery = total + deliveryCharge;
			const vatAmount = calculateVat(subtotalWithDelivery);
			const grandTotal = subtotalWithDelivery + vatAmount;
			const amountInPence = Math.round(grandTotal * 100);

			// Show billing address form first
			setShowBillingForm(true);
		} catch (error) {
			console.error('Error starting checkout:', error);
			Alert.alert(
				'Error',
				error instanceof Error
					? error.message
					: 'Failed to start checkout. Please try again.',
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

	const handleBillingAddressSubmit = async (address: BillingAddress) => {
		try {
			setIsProcessingCheckout(true);
			setShowBillingForm(false);
			setBillingAddress(address);

			// Convert billing address to WooCommerce format
			const billing: WooCommerceOrderBilling = {
				first_name: address.first_name,
				last_name: address.last_name,
				company: address.company || '',
				address_1: address.address_1,
				address_2: address.address_2 || '',
				city: address.city,
				state: address.state || '',
				postcode: address.postcode,
				country: address.country || 'GB',
				email: address.email || '',
				phone: address.phone || '',
			};

			console.log('[Checkout] Creating order in WooCommerce...', {
				itemCount: items.length,
			});

			// Create order in WooCommerce with "pending payment" status and billing address
			const order = await createOrder(items, billing);

			console.log('[Checkout] Order created:', {
				orderId: order.id,
				status: order.status,
				total: order.total,
			});

			// Store pending order
			setPendingOrder(order);

			// Calculate total for Stripe (in pence)
			const deliveryCharge = getNextDayDeliveryCharge();
			const subtotalWithDelivery = total + deliveryCharge;
			const vatAmount = calculateVat(subtotalWithDelivery);
			const grandTotal = subtotalWithDelivery + vatAmount;
			const amountInPence = Math.round(grandTotal * 100);

			// TODO: Create PaymentIntent on backend and get clientSecret
			// For now, using mock client secret for development
			const clientSecret = 'pi_mock_client_secret_for_development';
			console.warn(
				'[Checkout] Using mock PaymentIntent - replace with backend API call'
			);

			// Initialize Stripe PaymentSheet
			const initError = await initializePaymentSheetHelper(
				initPaymentSheet,
				clientSecret
			);
			if (initError.error) {
				throw new Error(
					`Failed to initialize payment: ${
						initError.error.message || 'Unknown error'
					}`
				);
			}

			// Present Stripe PaymentSheet
			const paymentResult = await presentPaymentSheetHelper(
				presentPaymentSheet
			);
			if (paymentResult.error) {
				// User cancelled or payment failed
				Alert.alert(
					'Payment Cancelled',
					paymentResult.error.message || 'Payment was cancelled or failed.',
					[
						{
							text: 'OK',
							onPress: () => {
								setPendingOrder(null);
								setBillingAddress(null);
							},
						},
					]
				);
				return;
			}

			// Payment successful - update order status
			await handlePaymentSuccess(order.id);
		} catch (error) {
			console.error('Error processing payment:', error);
			Alert.alert(
				'Error',
				error instanceof Error
					? error.message
					: 'Failed to process payment. Please try again.',
				[
					{
						text: 'OK',
						onPress: () => {
							setPendingOrder(null);
							setBillingAddress(null);
						},
					},
				]
			);
		} finally {
			setIsProcessingCheckout(false);
		}
	};

	const handlePaymentSuccess = async (orderId: number) => {
		try {
			// Update order to "processing" status (paid, ready for back office)
			const updatedOrder = await updateOrder(orderId, {
				status: 'processing',
				set_paid: true,
				date_paid: new Date().toISOString(),
			});

			console.log('[Checkout] Order updated to paid:', {
				orderId: updatedOrder.id,
				status: updatedOrder.status,
			});

			// Clear the basket
			await clear();

			// Show success message with order details
			Alert.alert(
				'Payment Successful!',
				`Your order #${
					updatedOrder.id
				} has been placed successfully.\n\nTotal: £${parseFloat(
					updatedOrder.total
				).toFixed(2)}\n\nYou can view your orders in the Orders section.`,
				[
					{
						text: 'View Orders',
						onPress: () => {
							router.push('/(tabs)/orders');
						},
					},
					{
						text: 'OK',
						style: 'default',
					},
				]
			);

			setPendingOrder(null);
			setBillingAddress(null);
		} catch (error) {
			console.error('Error updating order:', error);
			throw error;
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

			{/* Billing Address Form Modal */}
			<Modal
				visible={showBillingForm}
				animationType="slide"
				onRequestClose={() => {
					setShowBillingForm(false);
					setBillingAddress(null);
				}}
			>
				<SafeAreaView
					style={styles.modalContainer}
					edges={['top', 'bottom', 'left', 'right']}
				>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Billing Address</Text>
						<TouchableOpacity
							style={styles.modalCloseButton}
							onPress={() => {
								setShowBillingForm(false);
								setBillingAddress(null);
							}}
						>
							<Ionicons name="close" size={24} color={theme.colors.text} />
						</TouchableOpacity>
					</View>
					<BillingAddressForm
						onSubmit={handleBillingAddressSubmit}
						onCancel={() => {
							setShowBillingForm(false);
							setBillingAddress(null);
						}}
					/>
				</SafeAreaView>
			</Modal>
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
	modalContainer: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
		backgroundColor: theme.colors.surfaceElevated,
	},
	modalTitle: {
		...theme.typography.h2,
		color: theme.colors.text,
		fontWeight: '700',
	},
	modalCloseButton: {
		padding: theme.spacing.xs,
	},
});
