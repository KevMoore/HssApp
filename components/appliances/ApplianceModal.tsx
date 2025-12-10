import React, { useCallback, useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	TouchableOpacity,
	Dimensions,
	ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Appliance, getAllAppliances } from '../../services/applianceService';
import { ApplianceCard } from './ApplianceCard';
import { theme } from '../../constants/theme';

interface ApplianceModalProps {
	visible: boolean;
	onClose: () => void;
	onSelect: (appliance: Appliance) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SPACING = theme.spacing.md;
const CARD_PADDING = theme.spacing.md;
const NUM_COLUMNS = 2;
const CARD_WIDTH =
	(SCREEN_WIDTH - CARD_PADDING * 2 - CARD_SPACING * (NUM_COLUMNS - 1)) /
	NUM_COLUMNS;

export const ApplianceModal: React.FC<ApplianceModalProps> = ({
	visible,
	onClose,
	onSelect,
}) => {
	const [appliances, setAppliances] = useState<Appliance[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (visible) {
			loadAppliances();
		}
	}, [visible]);

	const loadAppliances = async () => {
		setLoading(true);
		try {
			const data = await getAllAppliances();
			setAppliances(data);
		} catch (error) {
			console.error('Error loading appliances:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSelect = useCallback(
		(appliance: Appliance) => {
			onSelect(appliance);
			onClose();
		},
		[onSelect, onClose]
	);

	const renderItem = useCallback(
		({ item }: { item: Appliance }) => (
			<ApplianceCard appliance={item} onPress={handleSelect} />
		),
		[handleSelect]
	);

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title}>Select Appliance</Text>
					<TouchableOpacity
						onPress={onClose}
						style={styles.closeButton}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<Ionicons name="close" size={28} color={theme.colors.text} />
					</TouchableOpacity>
				</View>

				{/* Appliance List */}
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={theme.colors.primary} />
						<Text style={styles.loadingText}>Loading appliances...</Text>
					</View>
				) : (
					<FlashList
						data={appliances}
						renderItem={renderItem}
						numColumns={NUM_COLUMNS}
						contentContainerStyle={styles.listContent}
						ItemSeparatorComponent={() => <View style={styles.separator} />}
						showsVerticalScrollIndicator={true}
					/>
				)}
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
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
		backgroundColor: theme.colors.surfaceElevated,
	},
	title: {
		...theme.typography.h2,
		color: theme.colors.text,
		flex: 1,
	},
	closeButton: {
		padding: theme.spacing.xs,
	},
	listContent: {
		padding: CARD_PADDING,
	},
	row: {
		gap: CARD_SPACING,
	},
	separator: {
		height: CARD_SPACING,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: theme.spacing.xl,
	},
	loadingText: {
		...theme.typography.body,
		color: theme.colors.textSecondary,
		marginTop: theme.spacing.md,
	},
});
