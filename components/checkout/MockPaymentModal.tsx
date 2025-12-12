/**
 * Mock Payment Modal Component
 * Temporary mock payment component while deciding on payment provider
 */

import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	TouchableOpacity,
	TextInput,
	ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Button } from '../ui/Button';

export interface MockPaymentResult {
	success: boolean;
	paymentMethod?: string;
}

interface MockPaymentModalProps {
	visible: boolean;
	amount: number;
	onPaymentComplete: (result: MockPaymentResult) => void;
	onCancel: () => void;
}

export const MockPaymentModal: React.FC<MockPaymentModalProps> = ({
	visible,
	amount,
	onPaymentComplete,
	onCancel,
}) => {
	const [paymentMethod, setPaymentMethod] = useState<string>('card');
	const [cardNumber, setCardNumber] = useState<string>('');
	const [expiryDate, setExpiryDate] = useState<string>('');
	const [cvv, setCvv] = useState<string>('');
	const [cardholderName, setCardholderName] = useState<string>('');
	const [isProcessing, setIsProcessing] = useState(false);

	const handlePayment = async () => {
		// Simulate payment processing
		setIsProcessing(true);

		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, 1500));

		setIsProcessing(false);

		// Always succeed for mock
		onPaymentComplete({
			success: true,
			paymentMethod: paymentMethod === 'card' ? 'Credit Card' : 'Other',
		});
	};

	const formatAmount = (amount: number): string => {
		return `£${(amount / 100).toFixed(2)}`;
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent={false}
			onRequestClose={onCancel}
		>
			<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title}>Mock Payment</Text>
					<TouchableOpacity
						style={styles.closeButton}
						onPress={onCancel}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<Ionicons name="close" size={24} color={theme.colors.text} />
					</TouchableOpacity>
				</View>

				<ScrollView
					style={styles.content}
					contentContainerStyle={styles.contentContainer}
					keyboardShouldPersistTaps="handled"
				>
					{/* Info Banner */}
					<View style={styles.infoBanner}>
						<Ionicons
							name="information-circle"
							size={20}
							color={theme.colors.primary}
						/>
						<Text style={styles.infoText}>
							This is a mock payment screen for testing. No real payment will be
							processed.
						</Text>
					</View>

					{/* Amount Display */}
					<View style={styles.amountContainer}>
						<Text style={styles.amountLabel}>Total Amount</Text>
						<Text style={styles.amountValue}>{formatAmount(amount)}</Text>
					</View>

					{/* Payment Method Selection */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Payment Method</Text>
						<View style={styles.paymentMethodContainer}>
							<TouchableOpacity
								style={[
									styles.paymentMethodOption,
									paymentMethod === 'card' && styles.paymentMethodSelected,
								]}
								onPress={() => setPaymentMethod('card')}
							>
								<Ionicons
									name="card"
									size={24}
									color={
										paymentMethod === 'card'
											? theme.colors.primary
											: theme.colors.textSecondary
									}
								/>
								<Text
									style={[
										styles.paymentMethodText,
										paymentMethod === 'card' &&
											styles.paymentMethodTextSelected,
									]}
								>
									Credit Card
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.paymentMethodOption,
									paymentMethod === 'other' && styles.paymentMethodSelected,
								]}
								onPress={() => setPaymentMethod('other')}
							>
								<Ionicons
									name="wallet"
									size={24}
									color={
										paymentMethod === 'other'
											? theme.colors.primary
											: theme.colors.textSecondary
									}
								/>
								<Text
									style={[
										styles.paymentMethodText,
										paymentMethod === 'other' &&
											styles.paymentMethodTextSelected,
									]}
								>
									Other
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Card Details Form (if card selected) */}
					{paymentMethod === 'card' && (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Card Details</Text>

							<View style={styles.formGroup}>
								<Text style={styles.label}>Card Number</Text>
								<TextInput
									style={styles.input}
									value={cardNumber}
									onChangeText={setCardNumber}
									placeholder="1234 5678 9012 3456"
									keyboardType="numeric"
									maxLength={19}
								/>
							</View>

							<View style={styles.formRow}>
								<View style={[styles.formGroup, styles.formGroupHalf]}>
									<Text style={styles.label}>Expiry Date</Text>
									<TextInput
										style={styles.input}
										value={expiryDate}
										onChangeText={setExpiryDate}
										placeholder="MM/YY"
										keyboardType="numeric"
										maxLength={5}
									/>
								</View>
								<View style={[styles.formGroup, styles.formGroupHalf]}>
									<Text style={styles.label}>CVV</Text>
									<TextInput
										style={styles.input}
										value={cvv}
										onChangeText={setCvv}
										placeholder="123"
										keyboardType="numeric"
										maxLength={4}
										secureTextEntry
									/>
								</View>
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.label}>Cardholder Name</Text>
								<TextInput
									style={styles.input}
									value={cardholderName}
									onChangeText={setCardholderName}
									placeholder="John Doe"
									autoCapitalize="words"
								/>
							</View>
						</View>
					)}

					{/* Action Buttons */}
					<View style={styles.buttonContainer}>
						<Button
							title="Cancel"
							onPress={onCancel}
							variant="outline"
							size="large"
							style={styles.button}
							disabled={isProcessing}
						/>
						<Button
							title={isProcessing ? 'Processing...' : 'Complete Payment'}
							onPress={handlePayment}
							variant="primary"
							size="large"
							style={styles.button}
							loading={isProcessing}
							disabled={isProcessing}
						/>
					</View>
				</ScrollView>
			</SafeAreaView>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
		backgroundColor: theme.colors.surfaceElevated,
	},
	title: {
		...theme.typography.h2,
		color: theme.colors.text,
		fontWeight: '700',
	},
	closeButton: {
		padding: theme.spacing.xs,
	},
	content: {
		flex: 1,
	},
	contentContainer: {
		padding: theme.spacing.md,
	},
	infoBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.lg,
		borderLeftWidth: 4,
		borderLeftColor: theme.colors.primary,
	},
	infoText: {
		...theme.typography.bodySmall,
		color: theme.colors.text,
		marginLeft: theme.spacing.sm,
		flex: 1,
	},
	amountContainer: {
		alignItems: 'center',
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.lg,
		marginBottom: theme.spacing.lg,
	},
	amountLabel: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.xs,
	},
	amountValue: {
		...theme.typography.h1,
		color: theme.colors.primary,
		fontWeight: '700',
	},
	section: {
		marginBottom: theme.spacing.lg,
	},
	sectionTitle: {
		...theme.typography.h3,
		color: theme.colors.text,
		marginBottom: theme.spacing.md,
		fontWeight: '600',
	},
	paymentMethodContainer: {
		flexDirection: 'row',
		gap: theme.spacing.md,
	},
	paymentMethodOption: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: theme.spacing.md,
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.md,
		borderWidth: 2,
		borderColor: theme.colors.border,
		gap: theme.spacing.sm,
	},
	paymentMethodSelected: {
		borderColor: theme.colors.primary,
		backgroundColor: theme.colors.surface,
	},
	paymentMethodText: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
	},
	paymentMethodTextSelected: {
		color: theme.colors.primary,
		fontWeight: '600',
	},
	formGroup: {
		marginBottom: theme.spacing.md,
	},
	formGroupHalf: {
		flex: 1,
	},
	formRow: {
		flexDirection: 'row',
		gap: theme.spacing.md,
	},
	label: {
		...theme.typography.body,
		fontWeight: '600',
		color: theme.colors.text,
		marginBottom: theme.spacing.xs,
	},
	input: {
		...theme.typography.body,
		backgroundColor: theme.colors.surfaceElevated,
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		color: theme.colors.text,
	},
	buttonContainer: {
		flexDirection: 'row',
		gap: theme.spacing.md,
		marginTop: theme.spacing.lg,
		marginBottom: theme.spacing.xl,
	},
	button: {
		flex: 1,
	},
});

