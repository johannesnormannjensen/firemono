# @firemono/nx

> Nx plugin for Firebase development with proper architecture

An Nx plugin that integrates Firebase projects into your Nx workspace with the **correct architecture** - Firebase Functions as proper Nx applications building to `dist/`, live reloading during development, and auto-persisted emulator data.

## ✨ Features

- 🚀 **Functions as Nx Apps**: Firebase Functions are real Nx applications with proper TypeScript, ESLint, and testing setup
- 📂 **Builds to dist/**: Functions build to workspace `dist/` directory following Nx conventions  
- 🔄 **Live Reloading**: Watch mode rebuilds functions automatically during development
- 💾 **Auto-Persisted Data**: Emulator data automatically saved/restored between sessions
- 🏗️ **esbuild**: Fast builds with `@nx/esbuild` executor
- 🧹 **Clean Architecture**: No copying, Firebase reads directly from dist
- 🔧 **Full Nx Integration**: Lint, test, build, and deploy with Nx tooling

## 📦 Installation

```bash
# Install the plugin
npm install -D @firemono/nx

# Or with yarn
yarn add -D @firemono/nx
```

## 🚀 Quick Start

### 1. Initialize Firebase Project

First, create your Firebase project configuration:

```bash
mkdir my-firebase-init
cd my-firebase-init
firebase init
# Select: Functions, Firestore, Hosting, Emulators
# Choose TypeScript for functions
cd ..
```

### 2. Generate Nx Firebase Project

```bash
nx generate @firemono/nx:init-app --name my-app --directory apps/my-app --initDirectory ./my-firebase-init
```

This creates:
- `apps/my-app/functions/` - Nx Functions app (builds to `dist/my-app/functions`)
- `apps/my-app/firebase/` - Firebase project (uses functions from dist)

### 3. Start Development

```bash
# Start with live reloading
nx dev my-app-firebase

# Or build manually  
nx build my-app-firebase

# Deploy to Firebase
nx deploy my-app-firebase
```

## 🏗️ Architecture

```
apps/
├── my-app/
│   ├── functions/           # Nx Functions app
│   │   ├── src/index.ts     # Source code
│   │   └── project.json     # → builds to dist/my-app/functions
│   └── firebase/            # Firebase project  
│       ├── firebase.json    # → source: "../../../dist/my-app/functions"
│       └── emulator-data/   # Auto-persisted data
└── dist/
    └── my-app/
        └── functions/       # Firebase reads from here!
```

## 🎯 Benefits

- **✅ Proper Nx Apps**: Functions follow Nx conventions with full tooling support
- **✅ Workspace dist/**: All builds go to workspace `dist/` directory  
- **✅ No File Copying**: Firebase reads directly from dist (no build step copying)
- **✅ Live Development**: Watch mode + Firebase emulators = instant feedback
- **✅ Auto-Persistence**: Emulator data saved/restored automatically
- **✅ TypeScript First**: Full TypeScript support with proper configurations
- **✅ Fast Builds**: esbuild for lightning-fast function builds

## 📋 Generator Options

```bash
nx generate @firemono/nx:init-app [options]
```

| Option | Description | Required |
|--------|-------------|----------|
| `--name` | Name of the Firebase project | ✅ |
| `--directory` | Directory where project should be created | ✅ |  
| `--initDirectory` | Path to Firebase init directory | ✅ |

### Example

```bash
nx generate @firemono/nx:init-app \
  --name ecommerce \
  --directory apps/ecommerce \
  --initDirectory ./firebase-init-ecommerce
```

Creates:
- `apps/ecommerce/functions/` (Nx app building to `dist/ecommerce/functions`)
- `apps/ecommerce/firebase/` (Firebase project using dist functions)

## 🔧 Generated Commands

Each Firebase project gets these Nx targets:

```bash
# Development with live reloading
nx dev my-app-firebase

# Build functions and prepare for deployment  
nx build my-app-firebase

# Deploy to Firebase
nx deploy my-app-firebase
nx deploy-functions my-app-firebase

# Emulator management
nx emulators:start my-app-firebase
nx emulators:debug my-app-firebase  
nx emulators:stop my-app-firebase

# Data management (auto-handled during dev)
nx data:export my-app-firebase
nx data:import my-app-firebase
```

## 🔄 Development Workflow

1. **Start Development**:
   ```bash
   nx dev my-app-firebase
   ```
   This runs:
   - `nx build my-app-functions --watch` (rebuilds on changes)
   - Firebase emulators with auto-import/export

2. **Edit Functions**: 
   - Edit `apps/my-app/functions/src/index.ts`
   - Functions rebuild automatically
   - Firebase sees changes instantly

3. **Data Persists**:
   - Stop emulators (Ctrl+C) → data auto-exported  
   - Restart → data auto-imported
   - Zero manual data management

## 🏷️ Project Tags

Generated projects include semantic tags:

- `type:firebase` - Firebase infrastructure project
- `scope:{name}` - Groups related projects  
- `platform:firebase` - Firebase deployment platform
- `feature:{detected}` - Auto-detected Firebase features

Use tags for targeted operations:
```bash
# Test all Firebase projects
nx run-many --target=test --projects=tag:type:firebase

# Build all projects in scope  
nx run-many --target=build --projects=tag:scope:my-app
```

## 📋 Requirements

- Nx workspace (v20.0.0+)
- Node.js 18+
- Firebase CLI (for deployment and emulators)

## 🤝 Contributing

Contributions welcome! Please read the [contributing guide](https://github.com/johannesfiremono/nx-firebase-monorepo-example/blob/main/CONTRIBUTING.md).

## 📄 License

MIT © [Johannes Firemono](https://github.com/johannesfiremono)

---

**Built with ❤️ for the Nx and Firebase communities**
