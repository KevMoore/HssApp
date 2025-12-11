import React, { useCallback, useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import {
	listOrders,
	WooCommerceOrder,
} from '../../services/woocommerceOrdersService';

export default function OrdersScreen() {
	const router = useRouter();
	const [orders, setOrders] = useState<WooCommerceOrder[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadOrders = useCallback(async () => {
		try {
			setError(null);
			// Fetch orders for the current customer (guest customer ID is stored locally)
			const fetchedOrders = await listOrders({
				per_page: 50,
			});
			// Sort by date (newest first)
			fetchedOrders.sort(
				(a, b) =>
					new Date(b.date_created).getTime() -
					new Date(a.date_created).getTime()
			);
			setOrders(fetchedOrders);
		} catch (err) {
			console.error('Error loading orders:', err);
			setError(err instanceof Error ? err.message : 'Failed to load orders');
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			setIsLoading(true);
			loadOrders();
		}, [loadOrders])
	);

	const handleRefresh = useCallback(() => {
		setIsRefreshing(true);
		loadOrders();
	}, [loadOrders]);

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
			month: 'short',
			year: 'numeric',
		});
	};

	const formatStatus = (status: string): string => {
		return status
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	if (isLoading && orders.length === 0) {
		return (
			<SafeAreaView style={styles.container} edges={['top']}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.loadingText}>Loading orders...</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			<View style={styles.header}>
				<Text style={styles.title}>My Orders</Text>
				<Text style={styles.subtitle}>
					{orders.length} {orders.length === 1 ? 'order' : 'orders'}
				</Text>
			</View>

			{error && (
				<View style={styles.errorContainer}>
					<Ionicons name="alert-circle" size={24} color={theme.colors.error} />
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
						<Text style={styles.retryButtonText}>Retry</Text>
					</TouchableOpacity>
				</View>
			)}

			{orders.length === 0 && !isLoading && !error ? (
				<ScrollView
					contentContainerStyle={styles.emptyContainer}
					showsVerticalScrollIndicator={false}
				>
					<Ionicons
						name="receipt-outline"
						size={80}
						color={theme.colors.textLight}
					/>
					<Text style={styles.emptyTitle}>No orders yet</Text>
					<Text style={styles.emptySubtitle}>
						Your orders will appear here once you place an order.
					</Text>
				</ScrollView>
			) : (
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
							tintColor={theme.colors.primary}
						/>
					}
				>
					{orders.map((order) => (
						<TouchableOpacity
							key={order.id}
							style={styles.orderCard}
							activeOpacity={0.7}
							onPress={() => router.push(`/order/${order.id}`)}
						>
							<View style={styles.orderHeader}>
								<View style={styles.orderHeaderLeft}>
									<Text style={styles.orderNumber}>Order #{order.id}</Text>
									<Text style={styles.orderDate}>
										{formatDate(order.date_created)}
									</Text>
								</View>
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

							<View style={styles.orderItems}>
								{order.line_items.slice(0, 3).map((item, index) => (
									<Text key={index} style={styles.orderItem}>
										{item.name} x{item.quantity}
									</Text>
								))}
								{order.line_items.length > 3 && (
									<Text style={styles.orderItemMore}>
										+{order.line_items.length - 3} more
									</Text>
								)}
							</View>

							<View style={styles.orderFooter}>
								<Text style={styles.orderTotal}>
									£{parseFloat(order.total).toFixed(2)}
								</Text>
								<Ionicons
									name="chevron-forward"
									size={20}
									color={theme.colors.textSecondary}
								/>
							</View>
						</TouchableOpacity>
					))}
				</ScrollView>
			)}
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
	errorContainer: {
		margin: theme.spacing.md,
		padding: theme.spacing.md,
		backgroundColor: theme.colors.error + '10',
		borderRadius: theme.borderRadius.md,
		borderWidth: 1,
		borderColor: theme.colors.error + '30',
		alignItems: 'center',
	},
	errorText: {
		...theme.typography.body,
		color: theme.colors.error,
		marginTop: theme.spacing.sm,
		textAlign: 'center',
	},
	retryButton: {
		marginTop: theme.spacing.md,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.sm,
		backgroundColor: theme.colors.error,
		borderRadius: theme.borderRadius.md,
	},
	retryButtonText: {
		...theme.typography.body,
		color: '#ffffff',
		fontWeight: '600',
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
		padding: theme.spacing.md,
	},
	orderCard: {
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		...theme.shadows.md,
	},
	orderHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: theme.spacing.md,
	},
	orderHeaderLeft: {
		flex: 1,
	},
	orderNumber: {
		...theme.typography.h3,
		color: theme.colors.primary,
		fontWeight: '700',
		marginBottom: theme.spacing.xs,
	},
	orderDate: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
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
	orderItems: {
		marginBottom: theme.spacing.md,
	},
	orderItem: {
		...theme.typography.body,
		color: theme.colors.text,
		marginBottom: theme.spacing.xs,
	},
	orderItemMore: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		fontStyle: 'italic',
	},
	orderFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: theme.spacing.md,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	orderTotal: {
		...theme.typography.h3,
		color: theme.colors.primary,
		fontWeight: '700',
	},
});
