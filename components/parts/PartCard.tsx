import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Part } from '../../types';
import { theme } from '../../constants/theme';
import { Button } from '../ui/Button';
import { openPartPage } from '../../utils/linking';

interface PartCardProps {
  part: Part;
  onPress?: () => void;
}

export const PartCard: React.FC<PartCardProps> = ({ part, onPress }) => {
  const handleBuyPress = () => {
    openPartPage(part.partNumber);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.partNumber}>{part.partNumber}</Text>
          {part.gcNumber && (
            <Text style={styles.gcNumber}>GC: {part.gcNumber}</Text>
          )}
        </View>
        <View style={styles.stockBadge}>
          <View
            style={[
              styles.stockIndicator,
              part.inStock ? styles.stockIn : styles.stockOut,
            ]}
          />
          <Text
            style={[
              styles.stockText,
              part.inStock ? styles.stockTextIn : styles.stockTextOut,
            ]}
          >
            {part.inStock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
      </View>

      <Text style={styles.name}>{part.name}</Text>
      {part.description && (
        <Text style={styles.description} numberOfLines={2}>
          {part.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.meta}>
          <Text style={styles.manufacturer}>{part.manufacturer}</Text>
          {part.category && (
            <Text style={styles.category}> • {part.category}</Text>
          )}
        </View>
        {part.price && (
          <Text style={styles.price}>£{part.price.toFixed(2)}</Text>
        )}
      </View>

      <Button
        title="View on Website"
        onPress={handleBuyPress}
        variant="primary"
        size="medium"
        style={styles.buyButton}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  partNumber: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  gcNumber: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  stockIn: {
    backgroundColor: theme.colors.success,
  },
  stockOut: {
    backgroundColor: theme.colors.error,
  },
  stockText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  stockTextIn: {
    color: theme.colors.success,
  },
  stockTextOut: {
    color: theme.colors.error,
  },
  name: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
  },
  description: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  meta: {
    flexDirection: 'row',
    flex: 1,
  },
  manufacturer: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.text,
  },
  category: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  price: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  buyButton: {
    width: '100%',
  },
});

