# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is an Nx monorepo demonstrating Firebase integration with Angular frontend and Firebase Functions backend. The workspace uses shared libraries for common code between frontend and backend.

**Key Architecture Patterns:**
- **Nx Workspace**: Structured monorepo with apps/, libs/, and tools/ directories
- **Firebase Integration**: Each Firebase project lives in apps/{project}/firebase/ with dedicated project.json
- **Shared Libraries**: Common code in libs/ with path mapping configured in tsconfig.base.json
- **Environment Management**: Environment-specific configurations for production, development, and emulator modes
- **Build Coordination**: Angular builds output to Firebase public folder (apps/demo/firebase/public)

## Common Development Commands

### Core Nx Commands
```bash
# Build all projects
nx run-many --target=build --all

# Lint all projects  
nx run-many --target=lint --all
# OR use the shorthand from package.json
npm run lint:all

# Test all projects
nx run-many --target=test --all

# Build specific project
nx build demo-angular
nx build demo-functions
```

### Firebase Development
```bash
# Start Firebase emulators with import
nx emulators:start demo-firebase

# Start emulators with debugging
nx emulators:debug demo-firebase

# Export emulator data
nx emulators:export demo-firebase

# Kill emulator ports
nx killports demo-firebase

# Deploy functions only
nx deploy-functions demo-firebase

# Full deploy
nx deploy demo-firebase
```

### Development Servers
```bash
# Serve Angular app (defaults to emulator configuration)
nx serve demo-angular

# Serve Angular with specific environment
nx serve demo-angular --configuration=development
nx serve demo-angular --configuration=production
nx serve demo-angular --configuration=emulator
```

### Testing
```bash
# Run tests for specific project
nx test demo-functions
nx test demo-angular

# Run e2e tests
nx e2e demo-angular-e2e

# Watch mode for function tests
nx test-watch demo-firebase
```

## Custom Nx Generator

This workspace includes a custom generator for creating new Firebase projects:

```bash
nx generate @firemono/plugin:firebase-project --name <project-name> [--directory <directory>] [--tags tag1,tag2]
```

This creates a new Firebase project structure with:
- Firebase configuration files (firebase.json, firestore.rules, etc.)
- Emulator setup with export/import capabilities
- Nx project configuration with build, serve, deploy targets

## Project Structure & Dependencies

**Path Mapping**: Uses TypeScript path mapping in tsconfig.base.json with @firemono/* aliases

**Environment Configurations**:
- Production: Uses libs/demo/angular/environment/src/lib/environment.ts
- Development: Uses environment.development.ts  
- Emulator: Uses environment.emulator.ts

**Build Dependencies**:
- Angular builds depend on shared libraries
- Firebase functions build to apps/{project}/firebase/functions/
- Angular builds to apps/{project}/firebase/public/

## Key Configuration Files

- `nx.json`: Nx workspace configuration with plugin setup and target defaults
- `tsconfig.base.json`: TypeScript path mapping for shared libraries
- `eslint.config.mjs`: ESLint configuration with Nx module boundary enforcement
- `vitest.workspace.ts`: Vitest test runner configuration