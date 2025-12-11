import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { theme } from '../constants/theme';
import { DeepLinkProvider } from '../contexts/DeepLinkContext';
import { NotificationPrompt } from '../components/NotificationPrompt';
import { useOnboarding } from '../hooks/useOnboarding';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import { AppState, AppStateStatus } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
	handleNotification: async (notification) => {
		console.log(
			'🔔 PUSH: Notification received:',
			JSON.stringify(notification.request.content)
		);

		// Check if this is a silent push notification
		const data = notification.request.content.data;
		if (data?.type === 'silent') {
			console.log(
				'🔔 PUSH: Silent push detected - returning false for all alerts'
			);
			// Handle silent push - don't show notification
			return {
				shouldShowAlert: false,
				shouldPlaySound: false,
				shouldSetBadge: false,
				shouldShowBanner: false,
				shouldShowList: false,
			};
		}

		console.log('🔔 PUSH: Regular notification detected - showing alert');
		// Regular notification handling
		return {
			shouldShowAlert: true,
			shouldPlaySound: true,
			shouldSetBadge: true,
			shouldShowBanner: true,
			shouldShowList: true,
		};
	},
});

function RootLayoutContent() {
	const {
		showNotificationPrompt,
		dismissNotificationPrompt,
		handleNotificationPromptEnable,
	} = useOnboarding();

	// Register for push notifications on app start
	useEffect(() => {
		const registerNotifications = async () => {
			try {
				// Check if permissions are already granted
				const { status } = await Notifications.getPermissionsAsync();
				if (status === 'granted') {
					// Get and register push token
					const token = await registerForPushNotificationsAsync();
					if (token) {
						// TODO: Send token to your backend API
						// await apiService.registerPushToken(token);
						console.log('Push token registered on app start:', token);
					}
				}
			} catch (error) {
				console.error('Error registering notifications on app start:', error);
			}
		};

		registerNotifications();
	}, []);

	// Handle app state changes to re-register token if needed
	useEffect(() => {
		const subscription = AppState.addEventListener(
			'change',
			async (nextAppState: AppStateStatus) => {
				if (nextAppState === 'active') {
					try {
						const { status } = await Notifications.getPermissionsAsync();
						if (status === 'granted') {
							const token = await registerForPushNotificationsAsync();
							if (token) {
								// TODO: Send token to your backend API
								// await apiService.registerPushToken(token);
								console.log(
									'Push token re-registered on app foreground:',
									token
								);
							}
						}
					} catch (error) {
						console.error(
							'Error re-registering notifications on foreground:',
							error
						);
					}
				}
			}
		);

		return () => {
			subscription.remove();
		};
	}, []);

	return (
		<>
			<StatusBar style="light" backgroundColor={theme.colors.primary} />
			<Stack
				screenOptions={{
					headerShown: false,
				}}
			>
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen
					name="search"
					options={({ navigation }) => ({
						presentation: 'fullScreenModal',
						headerShown: true,
						headerStyle: {
							backgroundColor: theme.colors.primary,
						},
						headerTintColor: '#ffffff',
						headerTitle: 'Search Results',
						headerTitleStyle: {
							fontWeight: '600',
						},
						headerLeft: () => (
							<TouchableOpacity
								onPress={() => navigation.goBack()}
								style={{
									marginLeft: 16,
									padding: 8,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'flex-start',
								}}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							>
								<Ionicons name="chevron-back" size={24} color="#ffffff" />
							</TouchableOpacity>
						),
					})}
				/>
				<Stack.Screen
					name="product/[id]"
					options={({ navigation }) => ({
						presentation: 'fullScreenModal',
						headerShown: true,
						headerStyle: {
							backgroundColor: theme.colors.primary,
						},
						headerTintColor: '#ffffff',
						headerTitle: 'Product Details',
						headerTitleStyle: {
							fontWeight: '600',
						},
						headerLeft: () => (
							<TouchableOpacity
								onPress={() => navigation.goBack()}
								style={{
									marginLeft: 16,
									padding: 8,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'flex-start',
								}}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							>
								<Ionicons name="chevron-back" size={24} color="#ffffff" />
							</TouchableOpacity>
						),
					})}
				/>
				<Stack.Screen
					name="faqs"
					options={{
						presentation: 'fullScreenModal',
						headerShown: true,
						headerStyle: {
							backgroundColor: theme.colors.primary,
						},
						headerTintColor: '#ffffff',
						headerTitle: 'FAQs',
						headerTitleStyle: {
							fontWeight: '600',
						},
					}}
				/>
				<Stack.Screen
					name="contact-us"
					options={{
						presentation: 'fullScreenModal',
						headerShown: true,
						headerStyle: {
							backgroundColor: theme.colors.primary,
						},
						headerTintColor: '#ffffff',
						headerTitle: 'Contact Us',
						headerTitleStyle: {
							fontWeight: '600',
						},
					}}
				/>
				<Stack.Screen
					name="order/[id]"
					options={{
						presentation: 'modal',
						headerShown: false,
					}}
				/>
			</Stack>

			{/* Notification Prompt */}
			<NotificationPrompt
				isVisible={showNotificationPrompt}
				onDismiss={dismissNotificationPrompt}
				onEnable={handleNotificationPromptEnable}
			/>
		</>
	);
}

// Get Stripe publishable key from environment
const getStripePublishableKey = (): string => {
	const publishableKey =
		process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
		Constants.expoConfig?.extra?.stripePublishableKey;

	if (!publishableKey) {
		console.warn(
			'Stripe publishable key not configured. Stripe payments will not work.'
		);
		return ''; // Return empty string - StripeProvider will handle gracefully
	}

	return publishableKey;
};

export default function RootLayout() {
	const stripePublishableKey = getStripePublishableKey();

	return (
		<SafeAreaProvider>
			<StripeProvider
				publishableKey={stripePublishableKey}
				merchantIdentifier="merchant.com.hssspares.app"
				urlScheme="hss"
			>
				<DeepLinkProvider>
					<RootLayoutContent />
				</DeepLinkProvider>
			</StripeProvider>
		</SafeAreaProvider>
	);
}
