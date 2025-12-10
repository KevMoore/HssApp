import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { Appliance } from '../../services/applianceService';

interface ApplianceCardProps {
	appliance: Appliance;
	onPress: (appliance: Appliance) => void;
}

export const ApplianceCard: React.FC<ApplianceCardProps> = ({
	appliance,
	onPress,
}) => {
	console.log('[ApplianceCard] Rendering appliance:', {
		id: appliance.id,
		name: appliance.name,
		imageUrl: appliance.imageUrl,
	});

	return (
		<TouchableOpacity
			style={styles.card}
			onPress={() => onPress(appliance)}
			activeOpacity={0.7}
		>
			<View style={styles.imageContainer}>
				{appliance.imageUrl ? (
					<Image
						source={{ uri: appliance.imageUrl }}
						style={styles.image}
						contentFit="cover"
						transition={200}
						placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
						onError={(error) => {
							console.error('[ApplianceCard] Image load error:', {
								imageUrl: appliance.imageUrl,
								error,
							});
						}}
						onLoad={() => {
							console.log('[ApplianceCard] Image loaded successfully:', appliance.imageUrl);
						}}
					/>
				) : (
					<View style={styles.placeholderContainer}>
						<Text style={styles.placeholderText}>No Image</Text>
					</View>
				)}
			</View>
			<Text style={styles.name} numberOfLines={2}>
				{appliance.name}
			</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	card: {
		flex: 1,
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.lg,
		overflow: 'hidden',
		...theme.shadows.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	imageContainer: {
		width: '100%',
		aspectRatio: 1,
		backgroundColor: theme.colors.surface,
		overflow: 'hidden',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	name: {
		...theme.typography.bodySmall,
		fontWeight: '600',
		color: theme.colors.text,
		padding: theme.spacing.md,
		textAlign: 'center',
		minHeight: 44,
	},
	placeholderContainer: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
	},
	placeholderText: {
		...theme.typography.bodySmall,
		color: theme.colors.textSecondary,
	},
});

