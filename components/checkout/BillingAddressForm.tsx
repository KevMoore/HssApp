/**
 * Billing Address Form Component
 * Collects UK billing address information
 */

import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	ScrollView,
	Alert,
} from 'react-native';
import { theme } from '../../constants/theme';
import { Button } from '../ui/Button';

export interface BillingAddress {
	first_name: string;
	last_name: string;
	company?: string;
	address_1: string;
	address_2?: string;
	city: string;
	state?: string;
	postcode: string;
	country: string;
	email?: string;
	phone?: string;
}

interface BillingAddressFormProps {
	onSubmit: (address: BillingAddress) => void;
	onCancel: () => void;
	initialValues?: Partial<BillingAddress>;
}

export const BillingAddressForm: React.FC<BillingAddressFormProps> = ({
	onSubmit,
	onCancel,
	initialValues,
}) => {
	const [formData, setFormData] = useState<BillingAddress>({
		first_name: initialValues?.first_name || '',
		last_name: initialValues?.last_name || '',
		company: initialValues?.company || '',
		address_1: initialValues?.address_1 || '',
		address_2: initialValues?.address_2 || '',
		city: initialValues?.city || '',
		state: initialValues?.state || '',
		postcode: initialValues?.postcode || '',
		country: initialValues?.country || 'GB',
		email: initialValues?.email || '',
		phone: initialValues?.phone || '',
	});

	const [errors, setErrors] = useState<Partial<Record<keyof BillingAddress, string>>>({});

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof BillingAddress, string>> = {};

		if (!formData.first_name.trim()) {
			newErrors.first_name = 'First name is required';
		}

		if (!formData.last_name.trim()) {
			newErrors.last_name = 'Last name is required';
		}

		if (!formData.address_1.trim()) {
			newErrors.address_1 = 'Address line 1 is required';
		}

		if (!formData.city.trim()) {
			newErrors.city = 'City is required';
		}

		if (!formData.postcode.trim()) {
			newErrors.postcode = 'Postcode is required';
		} else {
			// Basic UK postcode validation
			const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
			if (!ukPostcodeRegex.test(formData.postcode.trim())) {
				newErrors.postcode = 'Please enter a valid UK postcode';
			}
		}

		if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = 'Please enter a valid email address';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (validateForm()) {
			onSubmit(formData);
		}
	};

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}
			keyboardShouldPersistTaps="handled"
		>
			<Text style={styles.title}>Billing Address</Text>
			<Text style={styles.subtitle}>
				Please provide your UK billing address for your order
			</Text>

			<View style={styles.formGroup}>
				<Text style={styles.label}>First Name *</Text>
				<TextInput
					style={[styles.input, errors.first_name && styles.inputError]}
					value={formData.first_name}
					onChangeText={(text) =>
						setFormData({ ...formData, first_name: text })
					}
					placeholder="First name"
					autoCapitalize="words"
				/>
				{errors.first_name && (
					<Text style={styles.errorText}>{errors.first_name}</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<Text style={styles.label}>Last Name *</Text>
				<TextInput
					style={[styles.input, errors.last_name && styles.inputError]}
					value={formData.last_name}
					onChangeText={(text) =>
						setFormData({ ...formData, last_name: text })
					}
					placeholder="Last name"
					autoCapitalize="words"
				/>
				{errors.last_name && (
					<Text style={styles.errorText}>{errors.last_name}</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<Text style={styles.label}>Company (Optional)</Text>
				<TextInput
					style={styles.input}
					value={formData.company}
					onChangeText={(text) =>
						setFormData({ ...formData, company: text })
					}
					placeholder="Company name"
					autoCapitalize="words"
				/>
			</View>

			<View style={styles.formGroup}>
				<Text style={styles.label}>Address Line 1 *</Text>
				<TextInput
					style={[styles.input, errors.address_1 && styles.inputError]}
					value={formData.address_1}
					onChangeText={(text) =>
						setFormData({ ...formData, address_1: text })
					}
					placeholder="Street address"
					autoCapitalize="words"
				/>
				{errors.address_1 && (
					<Text style={styles.errorText}>{errors.address_1}</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<Text style={styles.label}>Address Line 2 (Optional)</Text>
				<TextInput
					style={styles.input}
					value={formData.address_2}
					onChangeText={(text) =>
						setFormData({ ...formData, address_2: text })
					}
					placeholder="Apartment, suite, etc."
					autoCapitalize="words"
				/>
			</View>

			<View style={styles.formGroup}>
				<Text style={styles.label}>City *</Text>
				<TextInput
					style={[styles.input, errors.city && styles.inputError]}
					value={formData.city}
					onChangeText={(text) => setFormData({ ...formData, city: text })}
					placeholder="City"
					autoCapitalize="words"
				/>
				{errors.city && (
					<Text style={styles.errorText}>{errors.city}</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<Text style={styles.label}>Postcode *</Text>
				<TextInput
					style={[styles.input, errors.postcode && styles.inputError]}
					value={formData.postcode}
					onChangeText={(text) =>
						setFormData({ ...formData, postcode: text.toUpperCase() })
					}
					placeholder="SW1A 1AA"
					autoCapitalize="characters"
					maxLength={8}
				/>
				{errors.postcode && (
					<Text style={styles.errorText}>{errors.postcode}</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<Text style={styles.label}>Email (Optional)</Text>
				<TextInput
					style={[styles.input, errors.email && styles.inputError]}
					value={formData.email}
					onChangeText={(text) =>
						setFormData({ ...formData, email: text })
					}
					placeholder="email@example.com"
					keyboardType="email-address"
					autoCapitalize="none"
					autoCorrect={false}
				/>
				{errors.email && (
					<Text style={styles.errorText}>{errors.email}</Text>
				)}
			</View>

			<View style={styles.formGroup}>
				<Text style={styles.label}>Phone (Optional)</Text>
				<TextInput
					style={styles.input}
					value={formData.phone}
					onChangeText={(text) =>
						setFormData({ ...formData, phone: text })
					}
					placeholder="07123456789"
					keyboardType="phone-pad"
				/>
			</View>

			<View style={styles.buttonContainer}>
				<Button
					title="Cancel"
					onPress={onCancel}
					variant="outline"
					size="large"
					style={styles.button}
				/>
				<Button
					title="Continue"
					onPress={handleSubmit}
					variant="primary"
					size="large"
					style={styles.button}
				/>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	contentContainer: {
		padding: theme.spacing.md,
	},
	title: {
		...theme.typography.h2,
		color: theme.colors.text,
		marginBottom: theme.spacing.xs,
	},
	subtitle: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.lg,
	},
	formGroup: {
		marginBottom: theme.spacing.md,
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
	inputError: {
		borderColor: theme.colors.error,
	},
	errorText: {
		...theme.typography.caption,
		color: theme.colors.error,
		marginTop: theme.spacing.xs,
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
