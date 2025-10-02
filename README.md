# 📦 Inventory Manager

A modern, offline-first inventory management application perfect for organizing storage boxes and their contents. Built with Angular and Firebase, this PWA works seamlessly both online and offline - ideal for managing inventory in basements, garages, or anywhere with poor internet connectivity.

## ✨ Features

### 📦 **Box Management**
- Create, edit, and delete storage boxes
- Add detailed descriptions and notes for each box
- Visual box listing with item counts
- QR code generation for each box for easy mobile access

### 🔍 **Item Management** 
- Add, edit, and delete items within boxes
- Search items across all boxes
- Detailed item descriptions and metadata
- Easy item organization and categorization

### 📱 **QR Code Integration**
- Generate QR codes for each box
- QR scanner component for quick box access
- Mobile-optimized scanning experience

### 🌐 **Offline-First Design**
- **Full offline functionality** - Works completely without internet
- **Automatic sync** - Changes sync when connection is restored
- **Firestore offline persistence** - Local caching with IndexedDB
- **Visual offline indicators** - Know when you're working offline
- **Multi-tab support** - Safe to use across browser tabs

### 🔒 **Security & Authentication**
- Firebase Authentication integration
- Secure environment variable configuration
- Route guards protecting authenticated content
- GitHub Secrets integration for CI/CD

### 🎨 **Modern UI/UX**
- **Dark/Light theme** support with system preference detection
- **Tailwind CSS** for responsive, modern styling
- **Progressive Web App** - Install on phone/desktop
- **Mobile-first responsive** design
- **Accessibility** features built-in

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- pnpm package manager
- Firebase project (optional for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inventory
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm start
   # or
   npm run start
   ```

4. **Open in browser**
   Navigate to `http://localhost:4200/`

The app will automatically reload when you make changes to source files.

## 🏗️ Development

### Available Scripts

- `pnpm start` - Start development server with hot reload
- `pnpm build` - Build the project for production
- `pnpm test` - Run unit tests via Karma
- `pnpm watch` - Build in watch mode for development

### Project Structure

```
src/
├── app/
│   ├── auth/              # Authentication services and guards
│   ├── box-detail/        # Box detail view with items
│   ├── box-form/          # Box creation and editing
│   ├── box-list/          # Box listing and management
│   ├── item-form/         # Item creation and editing
│   ├── item-search/       # Global item search
│   ├── login/             # Authentication UI
│   ├── navigation/        # App navigation and menu
│   ├── qr-scanner/        # QR code scanning functionality
│   └── services/          # Core services (Firestore, Offline, Theme)
├── environments/          # Environment configurations
└── types/                 # TypeScript type definitions
```

## 🔧 Configuration

### Firebase Setup
See [SECURITY_SETUP.md](./SECURITY_SETUP.md) for detailed Firebase configuration and security setup instructions.

### Environment Variables
- Development: Uses fallback values in environment files
- Production: Configured via GitHub Secrets for secure deployment

## 📱 PWA Features

This app can be installed as a Progressive Web App:

- **Desktop**: Chrome menu → "Install Inventory Manager"
- **Mobile**: Browser menu → "Add to Home Screen"

### PWA Capabilities
- Offline functionality
- App shortcuts for common actions
- Native app-like experience
- Background sync when online

## 🌐 Offline Capabilities

The app is designed to work seamlessly offline:

1. **Initial Load**: App shell cached for instant loading
2. **Data Access**: Previously viewed boxes and items available offline
3. **CRUD Operations**: Create, edit, delete items while offline
4. **Auto Sync**: All changes automatically sync when connection returns
5. **Visual Feedback**: Clear indicators show offline status

See [OFFLINE_FEATURES.md](./OFFLINE_FEATURES.md) for detailed offline functionality documentation.

## 🛠️ Technology Stack

- **Framework**: Angular 20.3.1
- **Database**: Firebase Firestore with offline persistence
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS 4.x
- **PWA**: Service Worker with caching strategies
- **QR Codes**: qrcode + qr-scanner
- **Package Manager**: pnpm
- **Build Tool**: Angular CLI with Vite

## 📚 Additional Documentation

- [OFFLINE_FEATURES.md](./OFFLINE_FEATURES.md) - Comprehensive offline functionality guide
- [SECURITY_SETUP.md](./SECURITY_SETUP.md) - Firebase security and deployment setup
- [WARP.md](./WARP.md) - Additional development notes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is private. See repository settings for access permissions.
