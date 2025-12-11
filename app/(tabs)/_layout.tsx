import {
	NativeTabs,
	Icon,
	Label,
	Badge,
} from 'expo-router/unstable-native-tabs';
import { Platform, DynamicColorIOS } from 'react-native';
import { theme } from '../../constants/theme';
import { useBasketStore } from '../../stores/basketStore';
import { useEffect } from 'react';

export const unstable_settings = {
	initialRouteName: 'index',
};

export default function TabsLayout() {
	const itemCount = useBasketStore((state) => state.itemCount);
	const loadBasket = useBasketStore((state) => state.loadBasket);

	useEffect(() => {
		loadBasket();
	}, [loadBasket]);

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
			badgeBackgroundColor={theme.colors.error}
			badgeTextColor="#ffffff"
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
				<Label>Basket</Label>
				<Icon sf="cart" drawable="ic_basket" />
				{itemCount > 0 && (
					<Badge>{itemCount > 99 ? '99+' : itemCount.toString()}</Badge>
				)}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="stores">
				<Icon sf="map" drawable="ic_map" />
				<Label>Stores</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="orders">
				<Icon sf="receipt" drawable="ic_receipt" />
				<Label>Orders</Label>
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
