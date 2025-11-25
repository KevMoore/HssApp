import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

/**
 * Register for push notifications and get the Expo push token
 * @returns The Expo push token string, or empty string if permissions not granted or error occurs
 */
export async function registerForPushNotificationsAsync(): Promise<string> {
	try {
		// Request permissions
		const { status: existingStatus } = await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== 'granted') {
			console.log('Push notification permissions not granted');
			return ''; // Return empty string if permissions not granted
		}

		// Get the Expo push token
		const projectId = Constants.expoConfig?.extra?.eas?.projectId;
		if (!projectId) {
			console.error('EAS project ID not found in app config');
			return '';
		}

		// Add timeout to prevent hanging
		const tokenPromise = Notifications.getExpoPushTokenAsync({
			projectId,
		});

		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error('Push token request timed out')), 10000); // 10 second timeout
		});

		const token = (await Promise.race([tokenPromise, timeoutPromise]).catch((error) => {
			console.error('Error getting push token:', error);
			throw error;
		})) as { data: string };

		return token.data;
	} catch (error) {
		console.error('Error registering for push notifications:', error);
		return ''; // Return empty string if token acquisition fails
	}
}

/**
 * Check if push notification permissions are granted
 * @returns true if permissions are granted, false otherwise
 */
export async function checkNotificationPermissions(): Promise<boolean> {
	try {
		const settings = await Notifications.getPermissionsAsync();
		return settings.status === 'granted';
	} catch (error) {
		console.error('Error checking notification permissions:', error);
		return false;
	}
}

/**
 * Request push notification permissions
 * @returns true if permissions were granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
	try {
		const { status } = await Notifications.requestPermissionsAsync();
		return status === 'granted';
	} catch (error) {
		console.error('Error requesting notification permissions:', error);
		return false;
	}
}

