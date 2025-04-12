# Nx Firebase Monorepo Example

A minimal example of using [Nx](https://nx.dev) to manage a monorepo that integrates [Firebase Functions](https://firebase.google.com/docs/functions), [Firestore](https://firebase.google.com/docs/firestore), and [Angular](https://angular.io) for full-stack development.

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

git clone https://github.com/your-username/nx-firebase-monorepo-example.git
cd nx-firebase-monorepo-example
npm install

### Development

Serve Angular frontend:

nx serve frontend

Serve Firebase Functions locally:

nx serve functions

Deploy to Firebase:

nx deploy functions
nx deploy frontend

Or using the Firebase CLI directly:

firebase deploy

## Devcontainer Support

This repo optionally includes a .devcontainer/ setup to provide a fully configured environment for development using VSCode + Docker.

To use:

1. Open the project in VSCode.
2. Click "Reopen in Container" when prompted.

## Testing

nx test frontend
nx test functions

## Build

nx build frontend
nx build functions

---

Feel free to fork, clone, or contribute to this repo!

