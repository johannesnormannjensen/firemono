# @firemono/nx-firebase-plugin

An Nx plugin for managing multiple Firebase projects in a monorepo. This plugin provides generators to scaffold Firebase projects with proper Nx integration, including Firebase Functions, Firestore, Authentication, and hosting support.

## Features

- 🔥 **Multiple Firebase Projects**: Manage multiple Firebase projects within a single Nx workspace
- ⚡ **Firebase Emulator Support**: Built-in emulator configuration with data import/export
- 🏗️ **Consistent Project Structure**: Follows Nx conventions with proper tagging and dependencies
- 🚀 **Deployment Targets**: Ready-to-use deployment targets for functions and hosting
- 🧪 **Testing Integration**: Seamless testing setup for Firebase Functions
- 📦 **Smart Tagging**: Automatic project tagging for better organization

## Installation

```bash
npm install --save-dev @firemono/nx-firebase-plugin
```

## Usage

### Generate a Firebase Project

```bash
nx generate @firemono/nx-firebase-plugin:firebase-project --name my-app --directory projects --tags backend,firebase
```

This creates:
- `apps/projects/my-app/firebase/` - Firebase project root
- Complete Firebase configuration files (firebase.json, firestore.rules, etc.)
- Nx project configuration with targets for emulators, deployment, and testing
- Proper project tagging and dependencies

### Options

- `--name`: Name of the Firebase project (required)
- `--directory`: Directory to create the project in (optional)
- `--tags`: Comma-separated tags to apply to the project (optional)

### Generated Project Structure

```
apps/
  {directory}/
    {name}/
      firebase/
        ├── firebase.json          # Firebase configuration
        ├── firestore.rules        # Firestore security rules
        ├── firestore.indexes.json # Firestore indexes
        ├── database.rules.json    # Realtime Database rules
        ├── storage.rules          # Storage security rules
        ├── exports/               # Emulator data export/import
        ├── functions/             # Functions source (placeholder)
        └── public/                # Hosting files (placeholder)
```

### Project Tags

The plugin automatically applies semantic tags:
- `type:firebase` - Identifies Firebase infrastructure projects
- `scope:{name}` - Groups related projects by domain/feature  
- `platform:firebase` - Indicates Firebase as deployment platform

### Available Targets

Generated Firebase projects include these Nx targets:

- `nx build {project-name}` - Build the project
- `nx emulators:start {project-name}` - Start Firebase emulators
- `nx emulators:debug {project-name}` - Start emulators with debugging
- `nx emulators:export {project-name}` - Export emulator data
- `nx deploy {project-name}` - Deploy to Firebase
- `nx deploy-functions {project-name}` - Deploy only functions
- `nx test {project-name}` - Run tests for related projects

## Workflow Integration

This plugin is designed to work with:

1. **Firebase Functions**: Create Nx libraries for your functions and reference them in the generated project
2. **Angular/React Apps**: Build web applications that deploy to Firebase Hosting
3. **Shared Libraries**: Share code between frontend and backend using Nx path mapping

## Example Monorepo Structure

```
apps/
  ecommerce/
    shop/
      firebase/          # Firebase project (this plugin)
    shop-angular/        # Angular app for hosting
    shop-functions/      # Firebase Functions
libs/
  ecommerce/
    shared/              # Shared models/types
    payment/             # Payment functions library
```

## Requirements

- Nx workspace (v20.0.0+)
- Node.js 18+
- Firebase CLI (for deployment and emulators)

## Contributing

This plugin is part of the [nx-firebase-monorepo-example](https://github.com/johannesfiremono/nx-firebase-monorepo-example) project. Contributions are welcome!

## License

MIT
