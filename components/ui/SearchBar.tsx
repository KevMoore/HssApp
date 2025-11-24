import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  Text,
  FlatList,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { getSearchSuggestions } from '../../services/searchHistoryService';

interface SearchBarProps extends TextInputProps {
  onClear?: () => void;
  showClearButton?: boolean;
  showSuggestions?: boolean;
  onSuggestionSelect?: (suggestion: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  showClearButton = true,
  showSuggestions = true,
  onSuggestionSelect,
  placeholder = 'Search...',
  style,
  ...props
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);

  const loadSuggestions = useCallback(async (query: string) => {
    if (!showSuggestions || !query || query.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestionsList(false);
      return;
    }

    try {
      const results = await getSearchSuggestions(query, 5);
      setSuggestions(results);
      setShowSuggestionsList(results.length > 0);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions([]);
      setShowSuggestionsList(false);
    }
  }, [showSuggestions]);

  useEffect(() => {
    if (value !== undefined) {
      loadSuggestions(value);
    }
  }, [value, loadSuggestions]);

  const handleTextChange = (text: string) => {
    onChangeText?.(text);
  };

  const handleSuggestionPress = (suggestion: string) => {
    onChangeText?.(suggestion);
    setShowSuggestionsList(false);
    Keyboard.dismiss();
    onSuggestionSelect?.(suggestion);
  };

  const handleClear = () => {
    onChangeText?.('');
    setSuggestions([]);
    setShowSuggestionsList(false);
    onClear?.();
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for suggestion press
    setTimeout(() => {
      setShowSuggestionsList(false);
    }, 200);
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.container}>
        <Ionicons
          name="search"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestionsList(true);
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textLight}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {showClearButton && value && value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {showSuggestionsList && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(item)}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={theme.colors.textSecondary}
                  style={styles.suggestionIcon}
                />
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
  },
  clearButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  suggestionIcon: {
    marginRight: theme.spacing.sm,
  },
  suggestionText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
});

