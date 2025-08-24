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

### Workflow

The plugin integrates an existing Firebase project (created with `firebase init`) into your Nx workspace:

1. **Create and initialize Firebase project**:
   ```bash
   mkdir temp-firebase
   cd temp-firebase
   firebase login
   firebase init
   # Select features: Functions, Firestore, Hosting, etc.
   # Choose your Firebase project
   # Configure according to your needs
   ```

2. **Integrate into Nx workspace**:
   ```bash
   nx generate @firemono/nx-firebase-plugin:firebase-project --name my-app --initDir ./temp-firebase --directory projects
   ```

This copies your Firebase configuration and creates:
- `apps/projects/my-app/firebase/` - Firebase project with all your files
- Nx project configuration with Firebase targets
- Auto-detected tags based on Firebase features used
- Proper Nx workspace integration

### Options

- `--name`: Name for the Firebase project in your Nx workspace (required)
- `--initDir`: Path to directory where you ran `firebase init` (required)
- `--directory`: Optional directory to nest the project under (optional)

### Generated Project Structure

```
apps/
  {directory}/
    {name}/
      firebase/
        ├── project.json          # Nx project configuration
        ├── firebase.json         # Your Firebase configuration
        ├── .firebaserc          # Firebase project settings
        ├── firestore.rules      # Firestore rules (if you chose Firestore)
        ├── firestore.indexes.json
        ├── functions/           # Functions source (if you chose Functions)
        ├── public/              # Hosting files (if you chose Hosting)
        └── ...                  # Other files from firebase init
```

### Auto-Generated Tags

The plugin automatically applies semantic tags based on your Firebase setup:
- `type:firebase` - Identifies Firebase infrastructure projects
- `scope:{name}` - Groups related projects by domain/feature  
- `platform:firebase` - Indicates Firebase as deployment platform
- `feature:functions` - Added if Firebase Functions are detected
- `feature:firestore` - Added if Firestore is detected  
- `feature:hosting` - Added if Firebase Hosting is detected
- `feature:storage` - Added if Firebase Storage is detected
- `feature:emulators` - Added if emulators are configured

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
