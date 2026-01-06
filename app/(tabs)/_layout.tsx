import {
	NativeTabs,
	Icon,
	Label,
	Badge,
	VectorIcon,
} from 'expo-router/unstable-native-tabs';
import { Platform, DynamicColorIOS } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
			backgroundColor={
				Platform.OS === 'android' ? '#ffffff' : theme.colors.primary
			} // White on Android, blue on iOS
			iconColor={{
				default: Platform.OS === 'android' ? '#000000' : '#ffffff80', // Black for non-active on Android (white bg), semi-transparent white on iOS
				selected:
					Platform.OS === 'android' ? '#ffffff' : theme.colors.primaryDark, // White for active on Android, dark blue on iOS
			}}
			badgeBackgroundColor={theme.colors.error}
			badgeTextColor="#ffffff"
			blurEffect="systemChromeMaterialDark"
			labelStyle={{
				default: {
					color: Platform.OS === 'android' ? '#000000' : 'black', // Black for non-active on Android (white bg), black on iOS
					fontSize: 10,
					fontWeight: '500',
				},
				selected: {
					color:
						Platform.OS === 'android'
							? theme.colors.primary
							: theme.colors.primaryDark, // Blue for active on Android (white bg), dark blue on iOS
					fontSize: 10,
					fontWeight: '700',
				},
			}}
			indicatorColor={
				Platform.OS === 'android'
					? theme.colors.primary
					: theme.colors.primaryLight
			} // Blue indicator on Android (white bg), light blue on iOS
		>
			<NativeTabs.Trigger name="index">
				{Platform.select({
					ios: <Icon sf="magnifyingglass" />,
					android: (
						<Icon src={<VectorIcon family={MaterialIcons} name="search" />} />
					),
				})}
				<Label>Search</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="basket">
				<Label>Basket</Label>
				{Platform.select({
					ios: <Icon sf="cart" />,
					android: (
						<Icon
							src={<VectorIcon family={MaterialIcons} name="shopping-cart" />}
						/>
					),
				})}
				{itemCount > 0 && (
					<Badge>{itemCount > 99 ? '99+' : itemCount.toString()}</Badge>
				)}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="stores">
				{Platform.select({
					ios: <Icon sf="map" />,
					android: (
						<Icon src={<VectorIcon family={MaterialIcons} name="place" />} />
					),
				})}
				<Label>Stores</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="account">
				{Platform.select({
					ios: <Icon sf="person.circle" />,
					android: (
						<Icon
							src={<VectorIcon family={MaterialIcons} name="account-circle" />}
						/>
					),
				})}
				<Label>Account</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="about">
				{Platform.select({
					ios: <Icon sf="info.circle" />,
					android: (
						<Icon src={<VectorIcon family={MaterialIcons} name="info" />} />
					),
				})}
				<Label>About</Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
