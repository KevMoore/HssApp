import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { theme } from '../../constants/theme';

const HSS_WEBSITE_URL = 'https://hssspares.co.uk';

export default function AccountScreen() {
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
      <WebView
        source={{ uri: `${HSS_WEBSITE_URL}/my-account/` }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    zIndex: 1,
  },
});

