# HSS Spares Mobile App

A cross-platform mobile application for Heating Spares Specialists (HSS) built with Expo SDK 54 and React Native. This app provides a clean and intuitive interface for searching boiler and heating parts.

## Features

- **Parts Search**: Search for parts by appliance, part number, GC number, or keyword
- **Clean UI**: Modern, user-friendly interface inspired by the HSS website
- **Quick Links**: Easy access to the HSS website and trade account signup
- **Popular Brands**: Quick access to popular manufacturer searches
- **External Purchase**: Seamlessly redirects to the HSS website for purchasing parts

## Tech Stack

- **Expo SDK 54**: Latest Expo SDK with React Native 0.81
- **Expo Router**: File-based routing for navigation
- **TypeScript**: Type-safe development
- **React Native**: Cross-platform mobile development
- **React Native Safe Area Context**: Proper handling of device safe areas

## Project Structure

```
HSS/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout with navigation
│   ├── index.tsx          # Home screen
│   └── search.tsx         # Search results screen
├── components/             # Reusable components
│   ├── parts/             # Part-related components
│   │   └── PartCard.tsx   # Part card component
│   └── ui/                # UI components
│       ├── Button.tsx     # Button component
│       └── SearchBar.tsx  # Search bar component
├── constants/             # App constants
│   └── theme.ts           # Theme configuration (colors, typography, etc.)
├── services/              # Business logic services
│   ├── partsService.ts    # Parts search service
│   ├── applianceService.ts # Appliance/category service
│   └── woocommerceService.ts # WooCommerce API client
├── types/                 # TypeScript type definitions
│   └── index.ts           # App-wide types
└── utils/                 # Utility functions
    ├── linking.ts         # External linking utilities
    └── productMapper.ts   # WooCommerce product to Part mapper
```

## Getting Started

### Prerequisites

- Node.js 20.19.4 or higher
- npm, yarn, pnpm, or bun
- Expo CLI (installed globally or via npx)
- iOS Simulator (for iOS development) or Android Emulator (for Android development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Development

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent naming conventions
- Keep components small and focused
- Use TypeScript types for all props and data structures

### Theme

The app uses a centralized theme system located in `constants/theme.ts`. Colors are inspired by the HSS website (blue/white theme).

### Adding New Features

1. **New Screen**: Add a new file in the `app/` directory
2. **New Component**: Add to `components/` directory (organize by feature)
3. **New Service**: Add to `services/` directory
4. **New Types**: Add to `types/index.ts` or create a new file in `types/`

## Future Enhancements

- Add part detail screen (in progress)
- Enhanced filters (manufacturer, category, stock status)
- Add favorites/bookmarks
- Push notifications for stock updates
- User authentication for trade accounts
- Order history
- Shopping cart integration

## Configuration

### Environment Variables

#### Public Variables (can use EXPO_PUBLIC_ prefix)

Create a `.env` file in the root directory with the WooCommerce base URL:

```
EXPO_PUBLIC_WOOCOMMERCE_BASE_URL=https://your-store.com
```

#### Secret Variables (use EAS secrets)

**Important**: Consumer key and secret are sensitive credentials and should NOT use the `EXPO_PUBLIC_` prefix as they would be exposed in the client bundle.

For production builds, use EAS secrets to securely inject these values:

```bash
# Set consumer key as an EAS secret
eas secret:create --scope project --name WOOCOMMERCE_CONSUMER_KEY --value your_consumer_key

# Set consumer secret as an EAS secret
eas secret:create --scope project --name WOOCOMMERCE_CONSUMER_SECRET --value your_consumer_secret
```

These secrets will be automatically injected into `Constants.expoConfig.extra` during the build process via `app.config.js`. They are available at build time but are not exposed in the client bundle in plain text (though note that any values used in client-side code can still be extracted by determined users).

**For local development**, create a `.env` file in the project root with the following (without the `EXPO_PUBLIC_` prefix):

```bash
# .env (gitignored - do NOT commit this file with secrets)
EXPO_PUBLIC_WOOCOMMERCE_BASE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=your_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=your_consumer_secret
```

The `app.config.js` file will automatically load these from `.env` during local development. The secrets are injected into `Constants.expoConfig.extra` and are accessible in your app code.

Alternatively, you can use `eas env:pull` to sync EAS environment variables locally:

```bash
eas env:pull --environment development
```

**Note**: Make sure your `.env` file is listed in `.gitignore` to prevent committing secrets to version control.

These credentials are used to authenticate with the WooCommerce REST API for fetching products and categories.

## Notes

- Product data is fetched from WooCommerce REST API
- Purchase functionality redirects to the HSS website
- The app is optimized for both iOS and Android
- Uses Expo Router for navigation (file-based routing)

## License

Private - Heating Spares Specialists Ltd

