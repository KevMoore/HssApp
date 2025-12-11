import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import {
	getOrder,
	WooCommerceOrder,
} from '../../services/woocommerceOrdersService';

export default function OrderDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const [order, setOrder] = useState<WooCommerceOrder | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (id) {
			loadOrder();
		}
	}, [id]);

	const loadOrder = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const orderId = parseInt(id || '0', 10);
			if (isNaN(orderId)) {
				throw new Error('Invalid order ID');
			}
			const fetchedOrder = await getOrder(orderId);
			setOrder(fetchedOrder);
		} catch (err) {
			console.error('Error loading order:', err);
			setError(
				err instanceof Error ? err.message : 'Failed to load order details'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const getStatusColor = (status: string): string => {
		switch (status.toLowerCase()) {
			case 'completed':
			case 'processing':
				return theme.colors.success;
			case 'pending':
			case 'on-hold':
				return theme.colors.warning || '#FFA500';
			case 'cancelled':
			case 'refunded':
			case 'failed':
				return theme.colors.error;
			default:
				return theme.colors.textSecondary;
		}
	};

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const formatStatus = (status: string): string => {
		return status
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container} edges={['top']}>
				<View style={styles.header}>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => router.back()}
					>
						<Ionicons name="chevron-back" size={24} color="#ffffff" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Order Details</Text>
					<View style={styles.backButton} />
				</View>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.loadingText}>Loading order...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error || !order) {
		return (
			<SafeAreaView style={styles.container} edges={['top']}>
				<View style={styles.header}>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => router.back()}
					>
						<Ionicons name="chevron-back" size={24} color="#ffffff" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Order Details</Text>
					<View style={styles.backButton} />
				</View>
				<View style={styles.errorContainer}>
					<Ionicons name="alert-circle" size={48} color={theme.colors.error} />
					<Text style={styles.errorText}>{error || 'Order not found'}</Text>
					<TouchableOpacity style={styles.retryButton} onPress={loadOrder}>
						<Text style={styles.retryButtonText}>Retry</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Ionicons name="chevron-back" size={24} color="#ffffff" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Order #{order.id}</Text>
				<View style={styles.backButton} />
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Order Status */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Order Status</Text>
						<View
							style={[
								styles.statusBadge,
								{ backgroundColor: getStatusColor(order.status) + '20' },
							]}
						>
							<Text
								style={[
									styles.statusText,
									{ color: getStatusColor(order.status) },
								]}
							>
								{formatStatus(order.status)}
							</Text>
						</View>
					</View>
					<Text style={styles.infoText}>
						Placed: {formatDate(order.date_created)}
					</Text>
					{order.date_paid && (
						<Text style={styles.infoText}>
							Paid: {formatDate(order.date_paid)}
						</Text>
					)}
				</View>

				{/* Billing Address */}
				{order.billing && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Billing Address</Text>
						<View style={styles.addressContainer}>
							{order.billing.first_name && order.billing.last_name && (
								<Text style={styles.addressText}>
									{order.billing.first_name} {order.billing.last_name}
								</Text>
							)}
							{order.billing.company && (
								<Text style={styles.addressText}>{order.billing.company}</Text>
							)}
							{order.billing.address_1 && (
								<Text style={styles.addressText}>
									{order.billing.address_1}
								</Text>
							)}
							{order.billing.address_2 && (
								<Text style={styles.addressText}>
									{order.billing.address_2}
								</Text>
							)}
							{(order.billing.city ||
								order.billing.state ||
								order.billing.postcode) && (
								<Text style={styles.addressText}>
									{[
										order.billing.city,
										order.billing.state,
										order.billing.postcode,
									]
										.filter(Boolean)
										.join(', ')}
								</Text>
							)}
							{order.billing.country && (
								<Text style={styles.addressText}>{order.billing.country}</Text>
							)}
							{order.billing.email && (
								<Text style={[styles.addressText, styles.emailText]}>
									{order.billing.email}
								</Text>
							)}
							{order.billing.phone && (
								<Text style={styles.addressText}>{order.billing.phone}</Text>
							)}
						</View>
					</View>
				)}

				{/* Order Items */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Order Items</Text>
					{order.line_items.map((item, index) => (
						<View key={index} style={styles.orderItem}>
							<View style={styles.orderItemHeader}>
								<Text style={styles.orderItemName}>{item.name}</Text>
								<Text style={styles.orderItemPrice}>
									£{parseFloat(item.total).toFixed(2)}
								</Text>
							</View>
							<Text style={styles.orderItemDetails}>
								Quantity: {item.quantity} × £{item.price.toFixed(2)}
							</Text>
							{item.sku && (
								<Text style={styles.orderItemSku}>SKU: {item.sku}</Text>
							)}
						</View>
					))}
				</View>

				{/* Shipping */}
				{order.shipping_lines && order.shipping_lines.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Shipping</Text>
						{order.shipping_lines.map((shipping, index) => (
							<View key={index} style={styles.shippingItem}>
								<Text style={styles.shippingMethod}>
									{shipping.method_title}
								</Text>
								<Text style={styles.shippingPrice}>
									£{parseFloat(shipping.total).toFixed(2)}
								</Text>
							</View>
						))}
					</View>
				)}

				{/* Order Summary */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Order Summary</Text>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Subtotal</Text>
						<Text style={styles.summaryValue}>
							£
							{(
								parseFloat(order.total) -
								parseFloat(order.shipping_total || '0') -
								parseFloat(order.total_tax || '0')
							).toFixed(2)}
						</Text>
					</View>
					{parseFloat(order.shipping_total || '0') > 0 && (
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>Shipping</Text>
							<Text style={styles.summaryValue}>
								£{parseFloat(order.shipping_total).toFixed(2)}
							</Text>
						</View>
					)}
					{parseFloat(order.total_tax || '0') > 0 && (
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>Tax</Text>
							<Text style={styles.summaryValue}>
								£{parseFloat(order.total_tax).toFixed(2)}
							</Text>
						</View>
					)}
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>Total</Text>
						<Text style={styles.totalValue}>
							£{parseFloat(order.total).toFixed(2)}
						</Text>
					</View>
				</View>

				{/* Payment Method */}
				{order.payment_method_title && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Payment Method</Text>
						<Text style={styles.infoText}>{order.payment_method_title}</Text>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: theme.spacing.md,
		backgroundColor: theme.colors.primary,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		...theme.typography.h3,
		color: '#ffffff',
		fontWeight: '700',
		flex: 1,
		textAlign: 'center',
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
		...theme.typography.body,
		color: theme.colors.error,
		marginTop: theme.spacing.md,
		textAlign: 'center',
	},
	retryButton: {
		marginTop: theme.spacing.lg,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
		backgroundColor: theme.colors.error,
		borderRadius: theme.borderRadius.md,
	},
	retryButtonText: {
		...theme.typography.body,
		color: '#ffffff',
		fontWeight: '600',
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: theme.spacing.md,
	},
	section: {
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		...theme.shadows.sm,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: theme.spacing.sm,
	},
	sectionTitle: {
		...theme.typography.h3,
		color: theme.colors.text,
		fontWeight: '700',
		marginBottom: theme.spacing.sm,
	},
	statusBadge: {
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.xs,
		borderRadius: theme.borderRadius.sm,
	},
	statusText: {
		...theme.typography.caption,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
	infoText: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.xs,
	},
	addressContainer: {
		marginTop: theme.spacing.xs,
	},
	addressText: {
		...theme.typography.body,
		color: theme.colors.text,
		marginBottom: theme.spacing.xs,
	},
	emailText: {
		marginTop: theme.spacing.sm,
		color: theme.colors.primary,
	},
	orderItem: {
		paddingVertical: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	orderItemHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: theme.spacing.xs,
	},
	orderItemName: {
		...theme.typography.body,
		fontWeight: '600',
		color: theme.colors.text,
		flex: 1,
		marginRight: theme.spacing.md,
	},
	orderItemPrice: {
		...theme.typography.body,
		fontWeight: '700',
		color: theme.colors.primary,
	},
	orderItemDetails: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		marginTop: theme.spacing.xs,
	},
	orderItemSku: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
		marginTop: theme.spacing.xs,
		fontStyle: 'italic',
	},
	shippingItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: theme.spacing.sm,
	},
	shippingMethod: {
		...theme.typography.body,
		color: theme.colors.text,
	},
	shippingPrice: {
		...theme.typography.body,
		fontWeight: '600',
		color: theme.colors.text,
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
		marginTop: theme.spacing.md,
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
});
