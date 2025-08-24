import { Tree, addProjectConfiguration, names, joinPathFragments, formatFiles, readJson, logger } from '@nx/devkit';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

import { GeneratorOptions } from './schema';

type Schema = GeneratorOptions;

function copyDirectoryToTree(tree: Tree, sourceDir: string, targetDir: string) {
  if (!existsSync(sourceDir)) {
    return;
  }
  
  const items = readdirSync(sourceDir);
  
  for (const item of items) {
    const sourcePath = join(sourceDir, item);
    const targetPath = joinPathFragments(targetDir, item);
    
    if (statSync(sourcePath).isDirectory()) {
      copyDirectoryToTree(tree, sourcePath, targetPath);
    } else {
      const content = require('fs').readFileSync(sourcePath, 'utf8');
      tree.write(targetPath, content);
    }
  }
}

function detectFirebaseFeatures(initDir: string): string[] {
  const features: string[] = [];
  const firebaseJsonPath = join(initDir, 'firebase.json');
  
  if (!existsSync(firebaseJsonPath)) {
    return features;
  }
  
  try {
    const firebaseConfig = JSON.parse(require('fs').readFileSync(firebaseJsonPath, 'utf8'));
    
    if (firebaseConfig.functions) features.push('functions');
    if (firebaseConfig.firestore) features.push('firestore');
    if (firebaseConfig.database) features.push('database');
    if (firebaseConfig.hosting) features.push('hosting');
    if (firebaseConfig.storage) features.push('storage');
    if (firebaseConfig.emulators) features.push('emulators');
    
    return features;
  } catch (error) {
    logger.warn(`Could not parse firebase.json: ${error}`);
    return features;
  }
}

function getDynamicConfiguration(features: string[]) {
  const hasEmulators = features.includes('emulators');
  const hasFunctions = features.includes('functions');
  const hasFirestore = features.includes('firestore');
  const hasDatabase = features.includes('database');
  const hasStorage = features.includes('storage');
  const hasHosting = features.includes('hosting');
  
  // Build emulator services list
  const emulatorServices = [];
  const emulatorPorts = [];
  
  if (hasFunctions) {
    emulatorServices.push('functions');
    emulatorPorts.push('5001');
  }
  if (hasFirestore) {
    emulatorServices.push('firestore');
    emulatorPorts.push('8080');
  }
  if (hasDatabase) {
    emulatorServices.push('database');
    emulatorPorts.push('9000');
  }
  if (hasStorage) {
    emulatorServices.push('storage');
    emulatorPorts.push('9199');
  }
  if (hasHosting) {
    emulatorServices.push('hosting');
    emulatorPorts.push('5000');
  }
  
  // Always include auth if we have emulators
  if (hasEmulators) {
    emulatorServices.push('auth');
    emulatorPorts.push('9099');
  }
  
  return {
    emulatorServices: emulatorServices.join(','),
    emulatorPorts: emulatorPorts.join(','),
    hasFunctions,
    hasEmulators,
    buildCommand: hasFunctions ? 'npm run build --prefix functions' : 'echo "No build needed"'
  };
}

function generateProjectReadme(tree: Tree, projectRoot: string, appName: string, features: string[], projectName: string) {
  const readmeContent = `# ${appName} Firebase Project

This Firebase project was generated using [@firemono/nx](https://www.npmjs.com/package/@firemono/nx).

## Features

${features.length > 0 
  ? features.map(f => `- ✅ **${f.charAt(0).toUpperCase() + f.slice(1)}**`).join('\n')
  : '- No Firebase features detected'}

## Quick Start

### Development
\`\`\`bash
# Start development environment with emulators
nx dev ${projectName}

# Build the project  
nx build ${projectName}
\`\`\`

### Deployment
\`\`\`bash
# Deploy everything to Firebase
nx deploy ${projectName}

${features.includes('functions') ? `# Deploy only functions
nx deploy-functions ${projectName}` : ''}
\`\`\`

### Data Management
\`\`\`bash
# Export emulator data
nx data:export ${projectName}

# Import emulator data
nx data:import ${projectName}

# Seed development data (customize the seed target)
nx data:seed ${projectName}
\`\`\`

### Debugging
\`\`\`bash
# Start emulators with function debugging
nx emulators:debug ${projectName}

${features.includes('functions') ? `# View function logs
nx logs ${projectName}` : ''}

# Kill emulator ports
nx emulators:stop ${projectName}
\`\`\`

## Firebase Console

Access your Firebase project console:
- [Firebase Console](https://console.firebase.google.com/)
- [Emulator Suite UI](http://localhost:4000) (when emulators are running)

## Customization

### Adding Data Seeding
Update the \`data:seed\` target in \`project.json\` to run your custom seeding script:
\`\`\`json
"data:seed": {
  "executor": "nx:run-commands",
  "options": {
    "cwd": "${projectRoot}",
    "command": "node scripts/seed-data.js"
  }
}
\`\`\`

### Environment Variables
Create a \`.env\` file in this directory for local development:
\`\`\`
FIREBASE_PROJECT_ID=your-project-id
# Add other environment variables here
\`\`\`

## Project Structure

\`\`\`
${projectRoot}/
├── firebase.json          # Firebase configuration
├── .firebaserc            # Firebase project settings
├── project.json           # Nx project configuration
${features.includes('functions') ? `├── functions/             # Firebase Functions source
│   ├── src/
│   ├── package.json
│   └── tsconfig.json` : ''}
${features.includes('firestore') ? `├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes` : ''}
${features.includes('hosting') ? `├── public/               # Hosting files` : ''}
${features.includes('storage') ? `├── storage.rules         # Storage security rules` : ''}
└── exports/              # Emulator data exports
\`\`\`

## Learn More

- [Firebase Documentation](https://firebase.google.com/docs)
- [Nx Documentation](https://nx.dev)
- [@firemono/nx Documentation](https://github.com/your-org/firemono)
`;

  tree.write(joinPathFragments(projectRoot, 'README.md'), readmeContent);
}

export default async function (tree: Tree, schema: Schema) {
  const nameParts = names(schema.name);
  // Use the full directory path provided (e.g., 'apps/my-app')
  const projectDir = schema.directory || `apps/${nameParts.fileName}`;
  const initDirResolved = resolve(schema.initDirectory);
  
  // Enhanced validation
  if (!existsSync(initDirResolved)) {
    throw new Error(`❌ Init directory does not exist: ${initDirResolved}\n\n💡 Make sure you run 'firebase init' first in your desired directory.`);
  }
  
  const firebaseJsonPath = join(initDirResolved, 'firebase.json');
  if (!existsSync(firebaseJsonPath)) {
    throw new Error(`❌ No firebase.json found in ${initDirResolved}\n\n💡 Run 'firebase init' in that directory first to set up your Firebase project.`);
  }
  
  const firebasercPath = join(initDirResolved, '.firebaserc');
  if (!existsSync(firebasercPath)) {
    logger.warn(`⚠️  No .firebaserc found. Make sure you've selected a Firebase project.`);
  }
  
  // Validate Firebase configuration
  try {
    const firebaseConfig = JSON.parse(require('fs').readFileSync(firebaseJsonPath, 'utf8'));
    if (Object.keys(firebaseConfig).length === 0) {
      throw new Error(`❌ firebase.json appears to be empty or invalid.\n\n💡 Re-run 'firebase init' to configure your project properly.`);
    }
  } catch (parseError) {
    throw new Error(`❌ Invalid firebase.json format: ${parseError}\n\n💡 Re-run 'firebase init' to fix the configuration.`);
  }
  
  // Project naming strategy - extract app name from directory path or use provided name
  const baseProjectName = schema.directory 
    ? schema.directory.split('/').pop() || nameParts.fileName
    : nameParts.fileName;
  const firebaseProjectName = `${baseProjectName}-firebase`;
  
  const projectRoot = joinPathFragments(projectDir, 'firebase');
  
  // Detect Firebase features from the init directory
  const features = detectFirebaseFeatures(initDirResolved);
  
  // Get dynamic configuration based on detected features
  const dynamicConfig = getDynamicConfiguration(features);
  
  // Auto-generate tags based on detected features
  const projectTags = [
    `type:firebase`,                    // Marks this as Firebase infrastructure project
    `scope:${baseProjectName}`,        // Groups related projects by feature/domain
    `platform:firebase`,               // Indicates deployment platform
    ...features.map(f => `feature:${f}`) // Tag each Firebase feature
  ];

  // Add Firebase project configuration
  addProjectConfiguration(tree, firebaseProjectName, {
    root: projectRoot,
    projectType: 'application',
    tags: projectTags,
    // Note: implicitDependencies should be added manually based on your specific setup
    targets: {
      build: {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: dynamicConfig.buildCommand 
        }
      },
      lint: {
        executor: '@nx/eslint:lint'
      },
      test: {
        executor: 'nx:run-commands',
        options: { 
          command: `nx run-many --target=test --projects=tag:scope:${baseProjectName}` 
        }
      },
      firebase: {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          forwardAllArgs: true,
          command: 'firebase' 
        }
      },
      killports: {
        executor: 'nx:run-commands',
        options: { 
          command: dynamicConfig.emulatorPorts 
            ? `npx -y kill-port --port ${dynamicConfig.emulatorPorts}` 
            : 'echo "No ports to kill"'
        }
      },
      'emulators:start': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: dynamicConfig.hasEmulators && dynamicConfig.emulatorServices 
            ? `firebase emulators:start --only=${dynamicConfig.emulatorServices} --import=./exports` 
            : 'echo "No emulators configured"'
        }
      },
      'emulators:debug': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: dynamicConfig.hasEmulators && dynamicConfig.emulatorServices
            ? `firebase emulators:start --inspect-functions --only=${dynamicConfig.emulatorServices} --import=./exports`
            : 'echo "No emulators configured"'
        }
      },
      'emulators:stop': {
        executor: 'nx:run-commands',
        options: { 
          command: dynamicConfig.emulatorPorts 
            ? `npx -y kill-port --port ${dynamicConfig.emulatorPorts}`
            : 'echo "No ports to kill"'
        }
      },
      getconfig: {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: 'firebase --config=firebase.json functions:config:get > .runtimeconfig.json' 
        }
      },
      deploy: {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: 'firebase deploy' 
        },
        dependsOn: ['build']
      },
      'deploy-functions': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: dynamicConfig.hasFunctions ? 'firebase deploy --only functions' : 'echo "No functions to deploy"'
        },
        dependsOn: ['build']
      },
      dev: {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: dynamicConfig.hasEmulators 
            ? `firebase emulators:start --only=${dynamicConfig.emulatorServices} --import=./exports`
            : 'echo "No development environment configured"'
        },
        dependsOn: ['build']
      },
      'data:export': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: 'firebase emulators:export ./exports --force' 
        }
      },
      'data:import': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: 'firebase emulators:start --import=./exports --export-on-exit=./exports' 
        }
      },
      'data:seed': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: 'echo "Add your data seeding script here"' 
        }
      },
      logs: {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: dynamicConfig.hasFunctions ? 'firebase functions:log' : 'echo "No functions configured"'
        }
      }
    }
  }, true);

  // Copy Firebase files from init directory to Nx workspace
  copyDirectoryToTree(tree, initDirResolved, projectRoot);
  
  // Generate project-specific README
  generateProjectReadme(tree, projectRoot, baseProjectName, features, firebaseProjectName);
  
  // Add/update .gitignore with Nx-specific ignores
  const gitignorePath = joinPathFragments(projectRoot, '.gitignore');
  const existingGitignore = tree.exists(gitignorePath) ? tree.read(gitignorePath, 'utf8') : '';
  const nxIgnores = `
# Nx
.nx/
dist/

# Node modules (if not already ignored)
node_modules/
`;
  
  if (!existingGitignore.includes('.nx/')) {
    tree.write(gitignorePath, existingGitignore + nxIgnores);
  }

  await formatFiles(tree);
  
  // Success message with detected features
  console.log(`\n✅ Firebase project ${firebaseProjectName} integrated successfully!`);
  console.log(`\n🔥 Detected Firebase features: ${features.join(', ') || 'none'}`);
  console.log(`\n📂 Project created at: ${projectRoot}`);
  console.log(`\n🏷️  Applied tags: ${projectTags.join(', ')}`);
  console.log(`\n📝 Quick start commands:`);
  if (dynamicConfig.hasEmulators) {
    console.log(`   - nx dev ${firebaseProjectName}              # Start development environment`);
  }
  console.log(`   - nx build ${firebaseProjectName}            # Build the project`);
  console.log(`   - nx deploy ${firebaseProjectName}           # Deploy to Firebase`);
  if (dynamicConfig.hasFunctions) {
    console.log(`   - nx logs ${firebaseProjectName}             # View function logs`);
  }
  console.log(`\n📖 See ${projectRoot}/README.md for detailed usage instructions`);
}