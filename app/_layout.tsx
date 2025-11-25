import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export default function RootLayout() {
	return (
		<SafeAreaProvider>
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
			</Stack>
		</SafeAreaProvider>
	);
}
