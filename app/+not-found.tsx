import { Link, useRouter } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { Button } from '../components/ui/Button';

export default function NotFoundScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
			<View style={styles.content}>
				<Text style={styles.title}>This screen doesn't exist.</Text>
				<Text style={styles.subtitle}>
					The route you're looking for could not be found.
				</Text>
				<Button
					title="Go to Home Screen"
					variant="primary"
					onPress={() => router.replace('/')}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: theme.spacing.xl,
	},
	title: {
		...theme.typography.h1,
		marginBottom: theme.spacing.md,
		color: theme.colors.text,
		textAlign: 'center',
	},
	subtitle: {
		...theme.typography.body,
		marginBottom: theme.spacing.xl,
		color: theme.colors.textSecondary,
		textAlign: 'center',
	},
});

