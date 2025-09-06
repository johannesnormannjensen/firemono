# Nx Firebase Monorepo Example

A minimal example of using [Nx](https://nx.dev) to manage a monorepo that integrates [Firebase Functions](https://firebase.google.com/docs/functions), [Firestore](https://firebase.google.com/docs/firestore), and [Angular](https://angular.dev) for full-stack development.

## What’s Inside

- Nx Workspace: Powerful tooling for structured monorepos.
- Angular Frontend: Web application built with Angular.
- Firebase Backend: Cloud Functions and Firestore as backend services.
- Devcontainers: Optional setup for reproducible development environments (VSCode + Docker).

## Project Structure
```
apps/
  frontend/           # Angular frontend app
  functions/          # Firebase Functions backend

libs/
  shared/             # Shared code between frontend and backend

tools/
  scripts/            # Custom Nx generators and utilities
``` 

## Getting Started

### Prerequisites

- Node.js (LTS)
- Firebase CLI (npm install -g firebase-tools)
- Nx CLI (npm install -g nx)
- Docker (for devcontainer support, optional)

### Setup

```bash
git clone https://github.com/johannesnormannjensen/firemono
cd nx-firebase-monorepo-example
npm install
```

### Development

Serve Angular frontend:
```bash
nx serve frontend
```

Serve Firebase Functions locally:

```bash
nx serve functions
```

Deploy to Firebase:

```bash
nx deploy functions
nx deploy frontend
```

Or using the Firebase CLI directly:

```bash
firebase deploy
```

## Devcontainer Support

This repo optionally includes a .devcontainer/ setup to provide a fully configured environment for development using VSCode + Docker.

To use:

1. Open the project in VSCode.
2. Click "Reopen in Container" when prompted.

## Testing

Run unit tests for Angular and Firebase Functions:

```bash
nx test frontend
nx test functions
```

## Build

Build the Angular frontend and Firebase Functions:

```bash
nx build frontend
nx build functions
```

---

### Generators

This workspace includes a custom Nx generator to scaffold additional Firebase projects in a monorepo.
To add a new Firebase project with default configuration, run:
```bash
nx generate workspace-generator firebase-project --name <project-name> [--directory <directory>] [--tags tag1,tag2]
```
This will create `apps/<directory>/<project-name>/firebase` (or `apps/<project-name>/firebase` by default) containing `firebase.json`, security rules, emulator settings, and an Nx project configuration with typical targets (`build`, `serve`, `emulate`, `deploy`, etc.).

Feel free to fork, clone, or contribute to this repo!

