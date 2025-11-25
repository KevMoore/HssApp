import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { getPartSuggestions } from '../../services/partsService';

interface SuggestionItem {
  text: string;
  type: 'history' | 'part';
}

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
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const isSelectingSuggestion = useRef(false);
  const isInitialMount = useRef(true);
  const hasUserInteracted = useRef(false);

  const loadSuggestions = useCallback(async (query: string) => {
    if (!showSuggestions || !query || query.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestionsList(false);
      return;
    }

    try {
      // Get suggestions from both sources in parallel
      const [historySuggestions, partSuggestions] = await Promise.all([
        getSearchSuggestions(query, 5),
        getPartSuggestions(query, 5),
      ]);

      // Combine suggestions, prioritizing history, then parts
      // Remove duplicates while preserving order
      const combined: SuggestionItem[] = [];
      const seen = new Set<string>();

      // Add history suggestions first (higher priority)
      for (const suggestion of historySuggestions) {
        const lower = suggestion.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          combined.push({ text: suggestion, type: 'history' });
        }
      }

      // Add part suggestions (lower priority, but still important)
      for (const suggestion of partSuggestions) {
        const lower = suggestion.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          combined.push({ text: suggestion, type: 'part' });
        }
      }

      // Limit to 8 total suggestions
      setSuggestions(combined.slice(0, 8));
      setShowSuggestionsList(combined.length > 0);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions([]);
      setShowSuggestionsList(false);
    }
  }, [showSuggestions]);

  useEffect(() => {
    // On initial mount, don't load suggestions if value is already set
    // (this means we're coming from navigation/search action)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (value && value.trim().length > 0) {
        // Don't show suggestions on initial mount with a value
        setSuggestions([]);
        setShowSuggestionsList(false);
        return;
      }
    }

    // Skip loading suggestions if we just selected a suggestion
    if (isSelectingSuggestion.current) {
      isSelectingSuggestion.current = false;
      // Ensure suggestions stay hidden after selection
      setShowSuggestionsList(false);
      setSuggestions([]);
      return;
    }

    // Only load suggestions if user has interacted (typed something)
    // or if the value is empty (to allow clearing and showing suggestions)
    if (value !== undefined && (hasUserInteracted.current || !value || value.trim().length === 0)) {
      loadSuggestions(value);
    }
  }, [value, loadSuggestions]);

  const handleTextChange = (text: string) => {
    hasUserInteracted.current = true;
    onChangeText?.(text);
  };

  const handleSuggestionPress = (suggestion: SuggestionItem) => {
    // Mark that we're selecting a suggestion to prevent re-loading suggestions
    isSelectingSuggestion.current = true;
    // Reset user interaction flag since this is programmatic, not user typing
    hasUserInteracted.current = false;
    // Clear suggestions immediately to prevent them from reappearing
    setSuggestions([]);
    setShowSuggestionsList(false);
    onChangeText?.(suggestion.text);
    Keyboard.dismiss();
    onSuggestionSelect?.(suggestion.text);
  };

  const handleClear = () => {
    hasUserInteracted.current = false;
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
            // Don't show suggestions if we just selected one
            if (!isSelectingSuggestion.current && suggestions.length > 0) {
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
            keyExtractor={(item, index) => `${item.text}-${item.type}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(item)}
              >
                <Ionicons
                  name={item.type === 'history' ? 'time-outline' : 'cube-outline'}
                  size={18}
                  color={theme.colors.textSecondary}
                  style={styles.suggestionIcon}
                />
                <Text style={styles.suggestionText}>{item.text}</Text>
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

