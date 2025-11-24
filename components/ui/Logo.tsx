import React from 'react';
import { Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';

interface LogoProps {
  variant?: 'full' | 'icon';
  height?: number;
  style?: ImageStyle | ViewStyle;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  tintColor?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  height = 40,
  style,
  resizeMode = 'contain',
  tintColor,
}) => {
  const logoSource =
    variant === 'icon'
      ? require('../../assets/hss-logo-icon.png')
      : require('../../assets/hss-logo.png');

  return (
    <Image
      source={logoSource}
      style={[
        styles.logo,
        { height, width: variant === 'full' ? height * 4 : height },
        tintColor && { tintColor },
        style,
      ]}
      resizeMode={resizeMode}
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    // No default tint - use original colors unless specified
  },
});

