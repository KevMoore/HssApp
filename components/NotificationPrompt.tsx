import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import {
	Alert,
	Dimensions,
	Modal,
	Platform,
	StyleSheet,
	Text,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NotificationPromptProps {
	isVisible: boolean;
	onDismiss: () => void;
	onEnable: () => void;
}

export const NotificationPrompt: React.FC<NotificationPromptProps> = ({
	isVisible,
	onDismiss,
	onEnable,
}) => {
	const [, setNotificationStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');

	useEffect(() => {
		const checkPermissions = async () => {
			try {
				const settings = await Notifications.getPermissionsAsync();
				setNotificationStatus(
					settings.status === 'granted'
						? 'granted'
						: settings.status === 'denied'
							? 'denied'
							: 'undetermined'
				);
			} catch {}
		};
		if (isVisible) {
			checkPermissions();
		}
	}, [isVisible]);

	const handleEnableNotifications = async () => {
		try {
			const token = await registerForPushNotificationsAsync();
			
			if (token) {
				// TODO: Send token to your backend API
				// await apiService.registerPushToken(token);
				console.log('Push token registered:', token);
				onEnable();
			} else {
				// Show alert explaining why notifications are important
				Alert.alert(
					'Notifications Recommended',
					'Notifications help you stay updated with order status, shipping updates, and special offers. You can enable them later in Settings.',
					[
						{ text: 'Maybe Later', onPress: onDismiss },
						{
							text: 'Open Settings',
							onPress: () => {
								// Open device settings
								if (Platform.OS === 'ios') {
									// For iOS, we can't directly open settings, but we can show instructions
									Alert.alert(
										'Enable Notifications',
										'To enable notifications:\n1. Go to Settings > HSS Spares\n2. Tap Notifications\n3. Turn on Allow Notifications',
										[{ text: 'Got it', onPress: onDismiss }]
									);
								} else {
									onDismiss();
								}
							},
						},
					]
				);
			}
		} catch (error) {
			console.error('Error enabling notifications:', error);
			onDismiss();
		}
	};

	const handleDismiss = () => {
		onDismiss();
	};

	if (!isVisible) return null;

	return (
		<Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
			<TouchableWithoutFeedback onPress={handleDismiss}>
				<View style={styles.overlay}>
					<TouchableWithoutFeedback>
						<View style={styles.container}>
							<SafeAreaView style={styles.safeArea}>
								{/* Background with gradient */}
								<View style={styles.background}>
									<View style={styles.gradientOverlay} />
								</View>

								{/* Content */}
								<View style={styles.content}>
									{/* Icon */}
									<View style={styles.iconContainer}>
										<Text style={styles.iconText}>🔔</Text>
									</View>

									{/* Title */}
									<Text style={styles.title}>Stay Updated</Text>

									{/* Description */}
									<Text style={styles.description}>
										Enable notifications to get order updates, shipping notifications, and exclusive
										offers from HSS Spares.
									</Text>

									{/* Benefits */}
									<View style={styles.benefitsContainer}>
										<View style={styles.benefitItem}>
											<Text style={styles.benefitText}>
												📦 Order status & shipping updates
											</Text>
										</View>
										<View style={styles.benefitItem}>
											<Text style={styles.benefitText}>
												💰 Special offers & promotions
											</Text>
										</View>
										<View style={styles.benefitItem}>
											<Text style={styles.benefitText}>
												🔔 Stock alerts & new arrivals
											</Text>
										</View>
									</View>
								</View>

								{/* Navigation - Fixed at bottom */}
								<View style={styles.navigation}>
									<View style={styles.navigationButtons}>
										<Button
											title="Maybe Later"
											onPress={handleDismiss}
											variant="outline"
											style={styles.navButton}
										/>

										<Button
											title="Enable Notifications"
											onPress={handleEnableNotifications}
											variant="primary"
											style={styles.navButton}
										/>
									</View>
								</View>
							</SafeAreaView>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		width: screenWidth * 0.9,
		maxWidth: 400,
		height: screenHeight * 0.8,
		maxHeight: screenHeight * 0.85,
		borderRadius: 20,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 20,
	},
	background: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: theme.colors.primary,
	},
	gradientOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: `${theme.colors.primary}20`,
	},
	safeArea: {
		flex: 1,
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-start',
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 20,
	},
	iconContainer: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	iconText: {
		fontSize: 30,
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 8,
		color: '#FFFFFF',
	},
	description: {
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 16,
		color: '#FFFFFF',
		lineHeight: 20,
		opacity: 0.9,
	},
	benefitsContainer: {
		width: '100%',
		alignItems: 'flex-start',
		marginTop: 8,
	},
	benefitItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	benefitText: {
		fontSize: 13,
		color: '#FFFFFF',
		opacity: 0.9,
	},
	navigation: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 16,
		backgroundColor: `${theme.colors.primary}CC`,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	navigationButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
	},
	navButton: {
		flex: 1,
	},
});

