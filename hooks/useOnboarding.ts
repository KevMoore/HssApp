import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { checkNotificationPermissions } from '../services/notificationService';

const ONBOARDING_KEY = 'onboarding_completed';

interface OnboardingState {
	hasCompletedOnboarding: boolean;
	showOnboarding: boolean;
	isFirstTimeUser: boolean;
	showNotificationPrompt: boolean;
}

export const useOnboarding = () => {
	const [onboardingState, setOnboardingState] = useState<OnboardingState>({
		hasCompletedOnboarding: false,
		showOnboarding: false,
		isFirstTimeUser: false,
		showNotificationPrompt: false,
	});

	const [isLoading, setIsLoading] = useState(true);

	// Load onboarding state from storage
	const loadOnboardingState = useCallback(async () => {
		try {
			setIsLoading(true);

			const storedValue = await AsyncStorage.getItem(ONBOARDING_KEY);

			if (storedValue === null) {
				// First time user - check notification permissions and show prompt if needed
				console.log('🎯 Onboarding: First time user detected');
				const notificationsEnabled = await checkNotificationPermissions();
				
				setOnboardingState({
					hasCompletedOnboarding: false,
					showOnboarding: false,
					isFirstTimeUser: true,
					showNotificationPrompt: !notificationsEnabled, // Show prompt if notifications not enabled
				});
			} else {
				// Returning user - don't show onboarding or notification prompt automatically
				const hasCompleted = JSON.parse(storedValue);
				console.log('🎯 Onboarding: Returning user, completed:', hasCompleted);
				
				setOnboardingState({
					hasCompletedOnboarding: hasCompleted,
					showOnboarding: false,
					isFirstTimeUser: false,
					showNotificationPrompt: false, // Don't show prompt automatically for returning users
				});
			}
		} catch (error) {
			console.error('🎯 Onboarding: Error loading state:', error);
			// Default to showing onboarding if there's an error
			setOnboardingState({
				hasCompletedOnboarding: false,
				showOnboarding: true,
				isFirstTimeUser: true,
				showNotificationPrompt: false,
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Mark onboarding as completed
	const completeOnboarding = useCallback(async () => {
		try {
			await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(true));
			console.log('🎯 Onboarding: Marked as completed');

			setOnboardingState((prev) => ({
				...prev,
				hasCompletedOnboarding: true,
				showOnboarding: false,
			}));
		} catch (error) {
			console.error('🎯 Onboarding: Error completing onboarding:', error);
		}
	}, []);

	// Skip onboarding (mark as completed to prevent showing again)
	const skipOnboarding = useCallback(async () => {
		try {
			// Mark as completed when user skips to prevent showing again
			await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(true));
			console.log('🎯 Onboarding: Skipped by user - marked as completed');

			// Check if notifications are enabled
			const notificationsEnabled = await checkNotificationPermissions();

			setOnboardingState((prev) => ({
				...prev,
				hasCompletedOnboarding: true,
				showOnboarding: false,
				showNotificationPrompt: !notificationsEnabled, // Show prompt if notifications not enabled
			}));
		} catch (error) {
			console.error('🎯 Onboarding: Error skipping onboarding:', error);
			setOnboardingState((prev) => ({
				...prev,
				showOnboarding: false,
				showNotificationPrompt: false,
			}));
		}
	}, []);

	// Dismiss notification prompt
	const dismissNotificationPrompt = useCallback(() => {
		console.log('🎯 Onboarding: Notification prompt dismissed');
		setOnboardingState((prev) => ({
			...prev,
			showNotificationPrompt: false,
		}));
	}, []);

	// Handle notification prompt enable
	const handleNotificationPromptEnable = useCallback(async () => {
		console.log('🎯 Onboarding: Notification prompt - user enabled notifications');
		// Permissions are handled in the NotificationPrompt component
		setOnboardingState((prev) => ({
			...prev,
			showNotificationPrompt: false,
		}));
	}, []);

	// Load state on mount
	useEffect(() => {
		loadOnboardingState();
	}, [loadOnboardingState]);

	return {
		...onboardingState,
		isLoading,
		completeOnboarding,
		skipOnboarding,
		dismissNotificationPrompt,
		handleNotificationPromptEnable,
	};
};

