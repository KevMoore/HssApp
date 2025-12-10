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
import { WebView } from 'react-native-webview';
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
	getCartCheckoutUrl,
	syncLocalBasketToWooCommerce,
	getCart,
	getCartToken,
	clearCart,
	deleteCartToken,
} from '../../services/woocommerceCartService';
import Constants from 'expo-constants';

export default function BasketScreen() {
	const {
		items,
		itemCount,
		total,
		isLoading,
		loadBasket,
		updateQuantity,
		removeItem,
	} = useBasketStore();
	const [showCheckoutWebView, setShowCheckoutWebView] = useState(false);
	const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
	const [isEstablishingSession, setIsEstablishingSession] = useState(false);

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
			setIsEstablishingSession(true);

			// CRITICAL: Check if local basket is empty
			if (!items || items.length === 0) {
				console.log(
					'[Checkout] Local basket is empty - clearing WooCommerce cart and token'
				);
				try {
					await clearCart();
				} catch (error) {
					console.warn(
						'[Checkout] Error clearing cart, deleting token anyway:',
						error
					);
					await deleteCartToken();
				}
				throw new Error(
					'Your basket is empty. Please add items before checkout.'
				);
			}

			// First, sync all local basket items to WooCommerce cart
			const localItems = items.map((item) => ({
				productId: parseInt(item.id, 10),
				quantity: item.quantity,
			}));

			console.log('[Checkout] Syncing basket to WooCommerce cart...', {
				itemCount: localItems.length,
				items: localItems.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
				})),
			});

			// Sync all items to WooCommerce cart - this returns the cart
			// This function clears existing cart items before adding new ones
			const cart = await syncLocalBasketToWooCommerce(localItems);

			if (!cart.items || cart.items.length === 0) {
				console.error('[Checkout] Cart is empty after sync', {
					cartResponse: cart,
					localItemCount: localItems.length,
				});
				throw new Error(
					'Cart is empty after sync. Please add items before checkout.'
				);
			}

			// Verify cart matches local basket
			const cartProductIds = new Set(
				cart.items.map((item) => item.product_id.toString())
			);
			const localProductIds = new Set(
				localItems.map((item) => item.productId.toString())
			);

			const missingInCart = localItems.filter(
				(item) => !cartProductIds.has(item.productId.toString())
			);
			const extraInCart = cart.items.filter(
				(item) => !localProductIds.has(item.product_id.toString())
			);

			if (missingInCart.length > 0 || extraInCart.length > 0) {
				console.warn('[Checkout] Cart mismatch detected', {
					missingInCart: missingInCart.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
					})),
					extraInCart: extraInCart.map((item) => ({
						productId: item.product_id,
						quantity: item.quantity,
					})),
				});

				// If there are extra items in cart (old items), try to clear and resync
				if (extraInCart.length > 0) {
					console.log(
						'[Checkout] Clearing cart and resyncing due to extra items'
					);
					try {
						await clearCart();
						const retryCart = await syncLocalBasketToWooCommerce(localItems);
						if (retryCart.items && retryCart.items.length > 0) {
							console.log('[Checkout] Resync successful');
							// Use the retry cart
							Object.assign(cart, retryCart);
						}
					} catch (retryError) {
						console.error('[Checkout] Resync failed:', retryError);
						// Continue with original cart - user can see the mismatch
					}
				}
			}

			console.log('[Checkout] Cart synced successfully', {
				itemCount: cart.items.length,
				localItemCount: localItems.length,
				items: cart.items.map((item) => ({
					id: item.id,
					productId: item.product_id,
					quantity: item.quantity,
					name: item.name,
				})),
			});

			// Get cart token and base URL
			const cartToken = await getCartToken();
			const baseUrl =
				process.env.EXPO_PUBLIC_WOOCOMMERCE_BASE_URL ||
				Constants.expoConfig?.extra?.woocommerceBaseUrl ||
				'https://hssspares.co.uk';
			const normalizedUrl = baseUrl.replace(/\/$/, '');
			const storeApiUrl = `${normalizedUrl}/wp-json/wc/store/v1`;

			// CRITICAL: Make a request to Store API with Cart-Token header BEFORE opening WebView
			// This establishes the session on the server side so the web page can recognize the cart
			console.log('[Checkout] Establishing web session with Store API...', {
				token: cartToken.substring(0, 10) + '...',
			});

			// Make a request to the cart endpoint - this should help establish the session
			// The WebView will share cookies with native requests on Android, and we'll inject JS on iOS
			const sessionResponse = await fetch(`${storeApiUrl}/cart`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Cart-Token': cartToken,
				},
			});

			if (!sessionResponse.ok) {
				console.warn(
					'[Checkout] Session establishment request failed, but continuing...',
					sessionResponse.status
				);
			} else {
				console.log('[Checkout] Session established successfully');
			}

			// Get the basket URL with cart token
			const basketUrl = `${normalizedUrl}/basket/?cart_token=${encodeURIComponent(
				cartToken
			)}`;

			console.log('[Checkout] Opening basket in WebView:', basketUrl);

			setCheckoutUrl(basketUrl);
			setShowCheckoutWebView(true);
		} catch (error) {
			console.error('Error preparing checkout:', error);
			Alert.alert(
				'Error',
				error instanceof Error
					? error.message
					: 'Failed to open checkout. Please try again.',
				[
					{
						text: 'OK',
					},
				]
			);
		} finally {
			setIsEstablishingSession(false);
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
						title={isEstablishingSession ? 'Preparing...' : 'Checkout'}
						onPress={handleCheckout}
						variant="primary"
						size="large"
						style={styles.checkoutButton}
						disabled={isEstablishingSession}
					/>

					<Text style={styles.checkoutNote}>
						Prices include VAT and next day delivery charge.
					</Text>
				</View>
			</ScrollView>

			{/* WebView Modal for Checkout */}
			<Modal
				visible={showCheckoutWebView}
				animationType="slide"
				onRequestClose={() => setShowCheckoutWebView(false)}
			>
				<SafeAreaView style={styles.webViewContainer} edges={['top']}>
					<View style={styles.webViewHeader}>
						<Text style={styles.webViewTitle}>Checkout</Text>
						<TouchableOpacity
							style={styles.webViewCloseButton}
							onPress={() => setShowCheckoutWebView(false)}
						>
							<Ionicons name="close" size={24} color={theme.colors.text} />
						</TouchableOpacity>
					</View>
					{checkoutUrl && (
						<WebView
							source={{ uri: checkoutUrl }}
							style={styles.webView}
							javaScriptEnabled={true}
							domStorageEnabled={true}
							sharedCookiesEnabled={true}
							thirdPartyCookiesEnabled={true}
							startInLoadingState={true}
							scalesPageToFit={true}
							injectedJavaScript={`
								// Inject JavaScript to help establish session
								// Read cart_token from URL and make a request to Store API
								(function() {
									const urlParams = new URLSearchParams(window.location.search);
									const cartToken = urlParams.get('cart_token');
									
									if (cartToken) {
										console.log('[WebView] Cart token found in URL');
										// Make a request to Store API to establish session
										// This helps WooCommerce recognize the cart
										const baseUrl = window.location.origin;
										fetch(baseUrl + '/wp-json/wc/store/v1/cart', {
											method: 'GET',
											headers: {
												'Content-Type': 'application/json',
												'Cart-Token': cartToken
											},
											credentials: 'include'
										}).then(() => {
											console.log('[WebView] Session established via Store API');
										}).catch((err) => {
											console.error('[WebView] Error establishing session:', err);
										});
									}
								})();
								true; // Required for injected JavaScript
							`}
							onError={(syntheticEvent) => {
								const { nativeEvent } = syntheticEvent;
								console.error('[WebView] Error:', nativeEvent);
							}}
							onHttpError={(syntheticEvent) => {
								const { nativeEvent } = syntheticEvent;
								console.error('[WebView] HTTP Error:', nativeEvent);
							}}
						/>
					)}
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
	webViewContainer: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	webViewHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: theme.spacing.md,
		backgroundColor: theme.colors.surfaceElevated,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	webViewTitle: {
		...theme.typography.h3,
		color: theme.colors.text,
		fontWeight: '600',
	},
	webViewCloseButton: {
		padding: theme.spacing.xs,
	},
	webView: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
});
