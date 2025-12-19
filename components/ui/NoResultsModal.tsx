import React from 'react';
import {
	Modal,
	View,
	Text,
	StyleSheet,
	TouchableWithoutFeedback,
	Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { theme } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NoResultsModalProps {
	isVisible: boolean;
	searchQuery: string;
	onDismiss: () => void;
	onTryAgain?: () => void;
}

export const NoResultsModal: React.FC<NoResultsModalProps> = ({
	isVisible,
	searchQuery,
	onDismiss,
	onTryAgain,
}) => {
	if (!isVisible) return null;

	return (
		<Modal
			visible={isVisible}
			transparent
			animationType="fade"
			statusBarTranslucent
		>
			<TouchableWithoutFeedback onPress={onDismiss}>
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
										<Ionicons
											name="search-outline"
											size={48}
											color="#FFFFFF"
										/>
									</View>

									{/* Title */}
									<Text style={styles.title}>No Results Found</Text>

									{/* Description */}
									<Text style={styles.description}>
										We couldn't find any parts matching "{searchQuery}"
									</Text>

									{/* Suggestions */}
									<View style={styles.suggestionsContainer}>
										<Text style={styles.suggestionsTitle}>Try:</Text>
										<View style={styles.suggestionItem}>
											<Text style={styles.suggestionText}>
												• Check your spelling
											</Text>
										</View>
										<View style={styles.suggestionItem}>
											<Text style={styles.suggestionText}>
												• Use fewer or different keywords
											</Text>
										</View>
										<View style={styles.suggestionItem}>
											<Text style={styles.suggestionText}>
												• Search by part number or GC number
											</Text>
										</View>
										<View style={styles.suggestionItem}>
											<Text style={styles.suggestionText}>
												• Browse by appliance category
											</Text>
										</View>
									</View>
								</View>

								{/* Navigation - Fixed at bottom */}
								<View style={styles.navigation}>
									<View style={styles.navigationButtons}>
										<Button
											title="Try Again"
											onPress={() => {
												onDismiss();
												onTryAgain?.();
											}}
											variant="primary"
											style={styles.navButton}
										/>
										<Button
											title="Close"
											onPress={onDismiss}
											variant="outline"
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
		maxHeight: screenHeight * 0.8,
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
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 12,
		color: '#FFFFFF',
	},
	description: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 24,
		color: '#FFFFFF',
		lineHeight: 22,
		opacity: 0.95,
		paddingHorizontal: 8,
	},
	suggestionsContainer: {
		width: '100%',
		alignItems: 'flex-start',
		marginTop: 8,
	},
	suggestionsTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
		marginBottom: 12,
		opacity: 0.95,
	},
	suggestionItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 8,
		width: '100%',
	},
	suggestionText: {
		fontSize: 14,
		color: '#FFFFFF',
		opacity: 0.9,
		lineHeight: 20,
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
		flexDirection: 'column',
		gap: 12,
	},
	navButton: {
		width: '100%',
	},
});

