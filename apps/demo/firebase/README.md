# demo Firebase Project

This Firebase project was generated using [@firemono/nx](https://www.npmjs.com/package/@firemono/nx).

## Features

- ✅ **Functions**
- ✅ **Firestore**
- ✅ **Hosting**
- ✅ **Emulators**

## Quick Start

### Development

```bash
# Start development environment with emulators
nx dev demo-firebase

# Build the project
nx build demo-firebase
```

### Deployment

```bash
# Deploy everything to Firebase
nx deploy demo-firebase

# Deploy only functions
nx deploy-functions demo-firebase
```

### Data Management

```bash
# Export emulator data
nx data:export demo-firebase

# Import emulator data
nx data:import demo-firebase

# Seed development data (customize the seed target)
nx data:seed demo-firebase
```

### Debugging

```bash
# Start emulators with function debugging
nx emulators:debug demo-firebase

# View function logs
nx logs demo-firebase

# Kill emulator ports
nx emulators:stop demo-firebase
```

## Firebase Console

Access your Firebase project console:

- [Firebase Console](https://console.firebase.google.com/)
- [Emulator Suite UI](http://localhost:4000) (when emulators are running)

## Customization

### Adding Data Seeding

Update the `data:seed` target in `project.json` to run your custom seeding script:

```json
"data:seed": {
  "executor": "nx:run-commands",
  "options": {
    "cwd": "apps/demo/firebase",
    "command": "node scripts/seed-data.js"
  }
}
```

### Environment Variables

Create a `.env` file in this directory for local development:

```
FIREBASE_PROJECT_ID=your-project-id
# Add other environment variables here
```

## Project Structure

```
apps/demo/firebase/
├── firebase.json          # Firebase configuration
├── .firebaserc            # Firebase project settings
├── project.json           # Nx project configuration
├── functions/             # Firebase Functions source
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── public/               # Hosting files

└── exports/              # Emulator data exports
```

## Learn More

- [Firebase Documentation](https://firebase.google.com/docs)
- [Nx Documentation](https://nx.dev)
- [@firemono/nx Documentation](https://github.com/your-org/firemono)
