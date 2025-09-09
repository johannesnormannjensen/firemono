import { Tree, addProjectConfiguration, names, joinPathFragments, formatFiles, logger, workspaceRoot } from '@nx/devkit';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

import { GeneratorOptions } from './schema';

function copyDirectoryToTree(tree: Tree, sourceDir: string, targetDir: string, excludeDirs: string[] = []) {
  if (!existsSync(sourceDir)) {
    return;
  }
  
  const items = readdirSync(sourceDir);
  
  for (const item of items) {
    // Skip excluded directories
    if (excludeDirs.includes(item)) {
      continue;
    }
    
    const sourcePath = join(sourceDir, item);
    const targetPath = joinPathFragments(targetDir, item);
    
    if (statSync(sourcePath).isDirectory()) {
      copyDirectoryToTree(tree, sourcePath, targetPath, excludeDirs);
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

function getDynamicConfiguration(features: string[], initDir?: string, functionsAppName?: string) {
  const hasEmulators = features.includes('emulators');
  const hasFunctions = features.includes('functions');
  const hasFirestore = features.includes('firestore');
  const hasDatabase = features.includes('database');
  const hasStorage = features.includes('storage');
  const hasHosting = features.includes('hosting');
  
  // Check if functions directory has proper setup
  const functionsHasPackageJson = initDir && hasFunctions 
    ? existsSync(join(initDir, 'functions', 'package.json'))
    : false;
    
  const functionsHasTsConfig = initDir && hasFunctions 
    ? existsSync(join(initDir, 'functions', 'tsconfig.json'))
    : false;
    
  const functionsIsComplete = functionsHasPackageJson && functionsHasTsConfig;
  
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
  
  // Use Nx build command if we have a functions app - will be fixed in main function
  let buildCommand = 'echo "✅ No build needed"';
  if (hasFunctions && functionsAppName) {
    buildCommand = 'nx-build-functions'; // placeholder, will be replaced
  } else if (functionsIsComplete) {
    buildCommand = 'npm run build --prefix functions';
  } else if (hasFunctions) {
    buildCommand = 'echo "⚠️  Functions detected but setup incomplete. Run \'firebase init functions\' to complete setup."';
  }
  
  return {
    emulatorServices: emulatorServices.join(','),
    emulatorPorts: emulatorPorts.join(','),
    hasFunctions,
    hasEmulators,
    buildCommand,
    functionsHasPackageJson,
    functionsIsComplete,
    functionsAppName
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
# Export emulator data (also auto-exported on emulator exit)
nx data:export ${projectName}

# Import emulator data (also auto-imported on emulator start)
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
└── emulator-data/        # Emulator data exports (auto-imported/exported)
\`\`\`

## Learn More

- [Firebase Documentation](https://firebase.google.com/docs)
- [Nx Documentation](https://nx.dev)
- [@firemono/nx Documentation](https://github.com/your-org/firemono)
`;

  tree.write(joinPathFragments(projectRoot, 'README.md'), readmeContent);
}

function addFirebaseDependenciesToWorkspace(tree: Tree, functionsSourceDir: string): { dependencies: Record<string, string>, devDependencies: Record<string, string> } {
  const functionsPackageJsonPath = join(functionsSourceDir, 'package.json');
  let functionsDeps = { dependencies: {}, devDependencies: {} };
  
  // Read existing functions dependencies if available
  if (existsSync(functionsPackageJsonPath)) {
    try {
      const functionsPackageJson = JSON.parse(require('fs').readFileSync(functionsPackageJsonPath, 'utf8'));
      functionsDeps = {
        dependencies: functionsPackageJson.dependencies || {},
        devDependencies: functionsPackageJson.devDependencies || {}
      };
    } catch (error) {
      logger.warn(`Could not parse functions package.json: ${error}`);
    }
  }
  
  // Add default Firebase dependencies if not present
  const defaultDeps = {
    'firebase-admin': '^13.2.0',
    'firebase-functions': '^6.0.1'
  };
  
  const defaultDevDeps = {
    '@typescript-eslint/eslint-plugin': '^5.12.0',
    '@typescript-eslint/parser': '^5.12.0',
    'eslint-config-google': '^0.14.0',
    'eslint-plugin-import': '^2.25.4',
    'firebase-functions-test': '^3.1.0'
  };
  
  // Merge with defaults
  functionsDeps.dependencies = { ...defaultDeps, ...functionsDeps.dependencies };
  functionsDeps.devDependencies = { ...defaultDevDeps, ...functionsDeps.devDependencies };
  
  // Read workspace package.json
  const workspacePackageJsonPath = join(workspaceRoot, 'package.json');
  if (existsSync(workspacePackageJsonPath)) {
    try {
      const workspacePackageJson = JSON.parse(require('fs').readFileSync(workspacePackageJsonPath, 'utf8'));
      
      // Smart merge: only add new dependencies or upgrade existing ones, never downgrade
      const mergeDependencies = (existing: Record<string, string> = {}, newDeps: Record<string, string>) => {
        const merged = { ...existing };
        for (const [pkg, version] of Object.entries(newDeps)) {
          if (!existing[pkg]) {
            // Add new dependency
            merged[pkg] = version;
          }
          // For existing dependencies, keep the existing version (don't downgrade)
          // User can manually upgrade if needed
        }
        return merged;
      };
      
      const updatedWorkspacePackage = {
        ...workspacePackageJson,
        dependencies: mergeDependencies(workspacePackageJson.dependencies, functionsDeps.dependencies),
        devDependencies: mergeDependencies(workspacePackageJson.devDependencies, functionsDeps.devDependencies)
      };
      
      require('fs').writeFileSync(workspacePackageJsonPath, JSON.stringify(updatedWorkspacePackage, null, 2));
      logger.info('✅ Added Firebase dependencies to workspace package.json (preserving existing versions)');
    } catch (error) {
      logger.warn(`Could not update workspace package.json: ${error}`);
    }
  }
  
  return functionsDeps;
}

function createFunctionsNxApp(tree: Tree, baseProjectName: string, projectDir: string, initDir: string) {
  const functionsAppName = `${baseProjectName}-functions`;
  const functionsAppRoot = joinPathFragments(projectDir, 'functions');
  const functionsSourceDir = join(initDir, 'functions');
  
  if (!existsSync(functionsSourceDir)) {
    logger.warn('⚠️  No functions directory found in init directory');
    return null;
  }
  
  // Add Firebase dependencies to workspace package.json
  addFirebaseDependenciesToWorkspace(tree, functionsSourceDir);
  
  // Create Functions app project.json
  const functionsProjectConfig = {
    name: functionsAppName,
    $schema: '../../../node_modules/nx/schemas/project-schema.json',
    sourceRoot: `${functionsAppRoot}/src`,
    projectType: 'application',
    tags: [`app:${baseProjectName}`, `scope:${baseProjectName}-firebase`, `group:${baseProjectName}-functions`],
    targets: {
      build: {
        executor: '@nx/esbuild:esbuild',
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: `dist/${baseProjectName}/functions`,
          main: `${functionsAppRoot}/src/index.ts`,
          tsConfig: `${functionsAppRoot}/tsconfig.app.json`,
          assets: [`${functionsAppRoot}/src/assets`],
          generatePackageJson: true,
          platform: 'node',
          bundle: true,
          thirdParty: false,
          dependenciesFieldType: 'dependencies',
          target: 'node22',
          format: ['cjs'],
          esbuildOptions: {
            logLevel: 'info'
          }
        }
      },
      lint: {
        executor: '@nx/eslint:lint'
      },
      test: {
        executor: '@nx/vite:test',
        outputs: ['{options.reportsDirectory}'],
        options: {
          reportsDirectory: `../../../coverage/${functionsAppRoot}`
        }
      }
    }
  };
  
  tree.write(joinPathFragments(functionsAppRoot, 'project.json'), JSON.stringify(functionsProjectConfig, null, 2));
  
  // Copy functions source code
  const functionsIndexPath = join(functionsSourceDir, 'src', 'index.ts');
  if (existsSync(functionsIndexPath)) {
    let functionsContent = require('fs').readFileSync(functionsIndexPath, 'utf8');
    // Uncomment the sample function if it exists
    if (functionsContent.includes('// export const helloWorld')) {
      functionsContent = functionsContent.replace('// export const helloWorld', 'export const helloWorld');
      functionsContent = functionsContent.replace('//   logger.info', '  logger.info');
      functionsContent = functionsContent.replace('//   response.send', '  response.send');
      functionsContent = functionsContent.replace('// });', '});');
    }
    tree.write(joinPathFragments(functionsAppRoot, 'src', 'index.ts'), functionsContent);
  }
  
  // Create TypeScript configurations
  const tsConfigBase = {
    extends: '../../../tsconfig.base.json',
    files: [],
    include: [],
    references: [
      { path: './tsconfig.app.json' },
      { path: './tsconfig.spec.json' }
    ],
    compilerOptions: {
      esModuleInterop: true
    }
  };
  
  const tsConfigApp = {
    extends: './tsconfig.json',
    compilerOptions: {
      outDir: '../../../dist/out-tsc',
      module: 'commonjs',
      types: ['node'],
      target: 'es2020'
    },
    exclude: ['vite.config.ts', 'src/**/*.spec.ts', 'src/**/*.test.ts'],
    include: ['src/**/*.ts']
  };
  
  const tsConfigSpec = {
    extends: './tsconfig.json',
    compilerOptions: {
      outDir: '../../../dist/out-tsc',
      types: ['vitest/globals', 'vitest/importMeta', 'vite/client', 'node', 'vitest']
    },
    include: [
      'vite.config.ts', 'vite.config.mts', 'vitest.config.ts', 'vitest.config.mts',
      'src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.test.tsx', 'src/**/*.spec.tsx',
      'src/**/*.test.js', 'src/**/*.spec.js', 'src/**/*.test.jsx', 'src/**/*.spec.jsx',
      'src/**/*.d.ts'
    ]
  };
  
  tree.write(joinPathFragments(functionsAppRoot, 'tsconfig.json'), JSON.stringify(tsConfigBase, null, 2));
  tree.write(joinPathFragments(functionsAppRoot, 'tsconfig.app.json'), JSON.stringify(tsConfigApp, null, 2));
  tree.write(joinPathFragments(functionsAppRoot, 'tsconfig.spec.json'), JSON.stringify(tsConfigSpec, null, 2));
  
  // Create ESLint config
  const eslintConfig = `import baseConfig from '../../../eslint.config.mjs';
import jsoncParser from 'jsonc-eslint-parser';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs}',
            '{projectRoot}/esbuild.config.{js,ts,mjs,mts}',
            '{projectRoot}/vite.config.{js,ts,mjs,mts}',
          ],
        },
      ],
    },
    languageOptions: {
      parser: jsoncParser,
    },
  },
];`;
  
  tree.write(joinPathFragments(functionsAppRoot, 'eslint.config.mjs'), eslintConfig);
  
  // Create Vite config
  const viteConfig = `import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/${functionsAppRoot}',
  plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  test: {
    watch: false,
    globals: true,
    passWithNoTests: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/${functionsAppRoot}',
      provider: 'v8',
    },
  },
}));`;
  
  tree.write(joinPathFragments(functionsAppRoot, 'vite.config.ts'), viteConfig);
  
  // Create minimal package.json for functions (dependencies are managed at workspace level)
  const functionsPackageJson = {
    name: functionsAppName,
    engines: {
      node: '22'
    },
    main: 'index.cjs',
    dependencies: {},
    devDependencies: {},
    private: true
  };
  
  tree.write(joinPathFragments(functionsAppRoot, 'package.json'), JSON.stringify(functionsPackageJson, null, 2));
  
  logger.info(`✅ Created Functions Nx app: ${functionsAppName}`);
  return functionsAppName;
}

function fixEslintConfiguration(tree: Tree, projectRoot: string) {
  // Remove any conflicting ESLint files in Firebase directory
  const rootEslintPath = joinPathFragments(projectRoot, '.eslintrc.js');
  if (tree.exists(rootEslintPath)) {
    tree.delete(rootEslintPath);
    logger.info('🗑️  Removed root .eslintrc.js to avoid conflicts with Nx ESLint configuration');
  }
}

export default async function (tree: Tree, schema: GeneratorOptions) {
  const nameParts = names(schema.name);
  // Use the full directory path provided (e.g., 'apps/my-app')
  const projectDir = schema.directory || `apps/${nameParts.fileName}`;
  // Resolve initDirectory relative to workspace root, not generator location
  const initDirResolved = schema.initDirectory.startsWith('/') 
    ? schema.initDirectory 
    : join(workspaceRoot, schema.initDirectory);
  
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
  
  // Create Functions Nx app if functions are detected
  let functionsAppName: string | null = null;
  if (features.includes('functions')) {
    functionsAppName = createFunctionsNxApp(tree, baseProjectName, projectDir, initDirResolved);
  }
  
  // Get dynamic configuration based on detected features
  const dynamicConfig = getDynamicConfiguration(features, initDirResolved, functionsAppName);
  
  // Fix the build command if we have functions
  if (functionsAppName && dynamicConfig.buildCommand === 'nx-build-functions') {
    dynamicConfig.buildCommand = `nx build ${functionsAppName} && rm -rf ${projectRoot}/functions && cp -r dist/${functionsAppName} ${projectRoot}/functions`;
  }
  
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
        options: functionsAppName ? {
          command: `nx build ${functionsAppName}`
        } : { 
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
            ? `firebase emulators:start --only=${dynamicConfig.emulatorServices} --import=./emulator-data --export-on-exit=./emulator-data`
            : 'echo "No emulators configured"'
        }
      },
      'emulators:debug': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: dynamicConfig.hasEmulators && dynamicConfig.emulatorServices
            ? `firebase emulators:start --inspect-functions --only=${dynamicConfig.emulatorServices} --import=./emulator-data --export-on-exit=./emulator-data`
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
        options: functionsAppName && dynamicConfig.hasEmulators ? {
          commands: [
            `nx build ${functionsAppName} --watch`,
            `cd ${projectRoot} && firebase emulators:start --only=${dynamicConfig.emulatorServices} --import=./emulator-data --export-on-exit=./emulator-data`
          ],
          parallel: true
        } : { 
          cwd: projectRoot,
          command: dynamicConfig.hasEmulators 
            ? `firebase emulators:start --only=${dynamicConfig.emulatorServices} --import=./emulator-data --export-on-exit=./emulator-data`
            : 'echo "No development environment configured"'
        }
      },
      'data:export': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: 'firebase emulators:export ./emulator-data --force' 
        }
      },
      'data:import': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: 'firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data' 
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

  // Copy Firebase files from init directory to Nx workspace (exclude functions if we created an Nx app)
  const excludeDirs = functionsAppName ? ['functions'] : [];
  copyDirectoryToTree(tree, initDirResolved, projectRoot, excludeDirs);
  
  // Update firebase.json to point to dist and remove predeploy commands if we have functions
  if (functionsAppName) {
    const firebaseJsonPath = joinPathFragments(projectRoot, 'firebase.json');
    if (tree.exists(firebaseJsonPath)) {
      const firebaseConfig = JSON.parse(tree.read(firebaseJsonPath, 'utf8') || '{}');
      if (firebaseConfig.functions && Array.isArray(firebaseConfig.functions)) {
        firebaseConfig.functions = firebaseConfig.functions.map((func: { predeploy?: string; source?: string; [key: string]: unknown }) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { predeploy, ...rest } = func;
          return {
            ...rest,
            source: `../../../dist/${baseProjectName}/functions`
          };
        });
        tree.write(firebaseJsonPath, JSON.stringify(firebaseConfig, null, 2));
        logger.info('✅ Updated firebase.json to use dist directory and removed predeploy commands for Nx compatibility');
      }
    }
  }
  
  // Fix ESLint configuration conflicts
  fixEslintConfiguration(tree, projectRoot);
  
  // Create emulator-data directory for emulator data
  tree.write(joinPathFragments(projectRoot, 'emulator-data', '.gitkeep'), '# This directory stores emulator data exports\n# The emulator-data directory is automatically used by Firebase emulators for data import/export\n# Data is automatically saved on emulator exit and loaded on startup\n');
  
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

# Emulator data (comment out if you want to commit emulator data)
emulator-data/
`;
  
  if (!existingGitignore.includes('.nx/')) {
    tree.write(gitignorePath, existingGitignore + nxIgnores);
  }

  await formatFiles(tree);
  
  // Success message with detected features
  console.log(`\n✅ Firebase project ${firebaseProjectName} integrated successfully!`);
  if (functionsAppName) {
    console.log(`\n🚀 Created Functions Nx app: ${functionsAppName}`);
    console.log(`   - Builds to: dist/${baseProjectName}/functions/`);
    console.log(`   - Firebase uses dist directory directly (no copying needed!)`);
    console.log(`   - Watch mode available for live development`);
    console.log(`   - Dependencies added to workspace package.json`);
  }
  console.log(`\n🔥 Detected Firebase features: ${features.join(', ') || 'none'}`);
  console.log(`\n📂 Project created at: ${projectRoot}`);
  console.log(`\n🏷️  Applied tags: ${projectTags.join(', ')}`);
  console.log(`\n📝 Quick start commands:`);
  if (functionsAppName) {
    console.log(`   - nx build ${functionsAppName}                # Build Functions app to dist/`);
  }
  if (dynamicConfig.hasEmulators) {
    console.log(`   - nx dev ${firebaseProjectName}              # Start development environment`);
  }
  console.log(`   - nx build ${firebaseProjectName}            # Build the project`);
  console.log(`   - nx deploy ${firebaseProjectName}           # Deploy to Firebase`);
  if (dynamicConfig.hasFunctions) {
    console.log(`   - nx logs ${firebaseProjectName}             # View function logs`);
  }
  console.log(`\n📖 See ${projectRoot}/README.md for detailed usage instructions`);
  if (functionsAppName) {
    console.log(`\n💡 Don't forget to run 'npm install' to install the Firebase dependencies`);
  }
}