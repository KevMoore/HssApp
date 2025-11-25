import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Part } from '../../types';
import { theme } from '../../constants/theme';
import { Button } from '../ui/Button';
import { useBasketStore } from '../../stores/basketStore';

interface PartCardProps {
	part: Part;
	onPress?: () => void;
}

export const PartCard: React.FC<PartCardProps> = ({ part, onPress }) => {
	const router = useRouter();
	const [isAdding, setIsAdding] = useState(false);
	const addItem = useBasketStore((state) => state.addItem);
	const refreshCount = useBasketStore((state) => state.refreshCount);

	const handleViewDetails = (e: any) => {
		e?.stopPropagation?.();
		router.push(`/product/${part.id}`);
	};

	const handleAddToBasket = async (e: any) => {
		e?.stopPropagation?.();
		if (!part.inStock) {
			Alert.alert('Out of Stock', 'This item is currently out of stock.');
			return;
		}

		setIsAdding(true);
		try {
			await addItem(part, 1);
			await refreshCount();
			Alert.alert(
				'Added to Basket',
				`${part.partNumber} has been added to your basket.`,
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

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={onPress}
			activeOpacity={0.7}
		>
			{part.imageUrl && (
				<Image
					source={{ uri: part.imageUrl }}
					style={styles.image}
					resizeMode="cover"
				/>
			)}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Text style={styles.partNumber}>{part.partNumber}</Text>
					{part.gcNumber && (
						<Text style={styles.gcNumber}>GC: {part.gcNumber}</Text>
					)}
				</View>
				<View style={styles.stockBadge}>
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

			<Text style={styles.name}>{part.name}</Text>
			{part.description && (
				<Text style={styles.description} numberOfLines={2}>
					{part.description}
				</Text>
			)}

			<View style={styles.footer}>
				<View style={styles.meta}>
					<Text style={styles.manufacturer}>{part.manufacturer}</Text>
					{part.category && (
						<Text style={styles.category}> • {part.category}</Text>
					)}
				</View>
				{part.price && (
					<Text style={styles.price}>£{part.price.toFixed(2)}</Text>
				)}
			</View>

			<View style={styles.buttonRow}>
				<Button
					title="View Details"
					onPress={handleViewDetails}
					variant="outline"
					size="medium"
					style={styles.viewButton}
				/>
				{part.inStock && (
					<TouchableOpacity
						style={styles.addButton}
						onPress={handleAddToBasket}
						disabled={isAdding}
						activeOpacity={0.7}
					>
						{isAdding ? (
							<Ionicons
								name="hourglass-outline"
								size={20}
								color={theme.colors.background}
							/>
						) : (
							<Ionicons
								name="basket-outline"
								size={20}
								color={theme.colors.background}
							/>
						)}
					</TouchableOpacity>
				)}
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		...theme.shadows.md,
		overflow: 'hidden',
	},
	image: {
		width: '100%',
		height: 200,
		backgroundColor: theme.colors.surface,
		marginBottom: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: theme.spacing.sm,
	},
	headerLeft: {
		flex: 1,
	},
	partNumber: {
		...theme.typography.h3,
		color: theme.colors.primary,
		marginBottom: theme.spacing.xs,
	},
	gcNumber: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
	},
	stockBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.xs,
		borderRadius: theme.borderRadius.sm,
		backgroundColor: theme.colors.surface,
	},
	stockIndicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: theme.spacing.xs,
	},
	stockIn: {
		backgroundColor: theme.colors.success,
	},
	stockOut: {
		backgroundColor: theme.colors.error,
	},
	stockText: {
		...theme.typography.caption,
		fontWeight: '600',
	},
	stockTextIn: {
		color: theme.colors.success,
	},
	stockTextOut: {
		color: theme.colors.error,
	},
	name: {
		...theme.typography.h3,
		marginBottom: theme.spacing.xs,
	},
	description: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.md,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: theme.spacing.md,
	},
	meta: {
		flexDirection: 'row',
		flex: 1,
	},
	manufacturer: {
		...theme.typography.bodySmall,
		fontWeight: '600',
		color: theme.colors.text,
	},
	category: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
	},
	price: {
		...theme.typography.h3,
		color: theme.colors.primary,
	},
	buttonRow: {
		flexDirection: 'row',
		gap: theme.spacing.sm,
		alignItems: 'center',
	},
	viewButton: {
		flex: 1,
	},
	addButton: {
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.md,
		width: 48,
		height: 48,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
