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

Create a `.env` file in the root directory with the following WooCommerce API credentials:

```
EXPO_PUBLIC_WOOCOMMERCE_BASE_URL=https://your-store.com
EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_KEY=your_consumer_key
EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET=your_consumer_secret
```

These credentials are used to authenticate with the WooCommerce REST API for fetching products and categories.

## Notes

- Product data is fetched from WooCommerce REST API
- Purchase functionality redirects to the HSS website
- The app is optimized for both iOS and Android
- Uses Expo Router for navigation (file-based routing)

## License

Private - Heating Spares Specialists Ltd

