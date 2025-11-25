import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import {
	Platform,
	DynamicColorIOS,
	View,
	Text,
	StyleSheet,
} from 'react-native';
import { theme } from '../../constants/theme';
import { useBasketStore } from '../../stores/basketStore';
import { useEffect } from 'react';

export const unstable_settings = {
	initialRouteName: 'index',
};

function BasketBadge() {
	const itemCount = useBasketStore((state) => state.itemCount);
	const loadBasket = useBasketStore((state) => state.loadBasket);

	useEffect(() => {
		loadBasket();
	}, [loadBasket]);

	if (itemCount === 0) return null;

	return (
		<View style={styles.badge}>
			<Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
		</View>
	);
}

export default function TabsLayout() {
	// Use DynamicColorIOS for liquid glass to adapt to light/dark mode
	const tabBarLabelColor =
		Platform.OS === 'ios'
			? DynamicColorIOS({
					dark: '#ffffff',
					light: '#ffffff',
			  })
			: '#ffffff';

	return (
		<NativeTabs
			backgroundColor={theme.colors.primary}
			iconColor={{
				default: '#ffffff80', // 50% opacity white for unselected
				selected: theme.colors.primaryDark, // Dark blue from branding for selected
			}}
			blurEffect="systemChromeMaterialDark"
			labelStyle={{
				default: {
					color: 'black',
					fontSize: 10,
					fontWeight: '500',
				},
				selected: {
					color: theme.colors.primaryDark,
					fontSize: 10,
					fontWeight: '700',
				},
			}}
			indicatorColor={theme.colors.primaryLight}
		>
			<NativeTabs.Trigger name="index">
				<Icon sf="magnifyingglass" drawable="ic_search" />
				<Label>Search</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="basket">
				<Icon sf="cart" drawable="ic_basket" />
				<Label>Basket</Label>
				<BasketBadge />
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="stores">
				<Icon sf="map" drawable="ic_map" />
				<Label>Stores</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="account">
				<Icon sf="person.circle" drawable="ic_account" />
				<Label>Account</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="about">
				<Icon sf="info.circle" drawable="ic_info" />
				<Label>About</Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}

const styles = StyleSheet.create({
	basketIconContainer: {
		position: 'relative',
		width: 24,
		height: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
	badge: {
		position: 'absolute',
		top: -6,
		right: -8,
		backgroundColor: theme.colors.error,
		borderRadius: 10,
		minWidth: 20,
		height: 20,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 4,
		borderWidth: 2,
		borderColor: theme.colors.primary,
	},
	badgeText: {
		color: '#ffffff',
		fontSize: 10,
		fontWeight: '700',
		textAlign: 'center',
	},
});
