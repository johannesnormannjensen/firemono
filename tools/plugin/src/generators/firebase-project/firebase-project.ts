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

export default async function (tree: Tree, schema: Schema) {
  const nameParts = names(schema.name);
  const projectDir = schema.directory ? `${names(schema.directory).fileName}/${nameParts.fileName}` : nameParts.fileName;
  const initDirResolved = resolve(schema.initDir);
  
  // Validate that the init directory exists and has firebase.json
  if (!existsSync(initDirResolved)) {
    throw new Error(`Init directory does not exist: ${initDirResolved}`);
  }
  
  if (!existsSync(join(initDirResolved, 'firebase.json'))) {
    throw new Error(`No firebase.json found in ${initDirResolved}. Did you run 'firebase init' there?`);
  }
  
  // Project naming strategy  
  const baseProjectName = projectDir.replace(/\//g, '-');
  const firebaseProjectName = `${baseProjectName}-firebase`;
  
  const projectRoot = joinPathFragments('apps', projectDir, 'firebase');
  
  // Detect Firebase features from the init directory
  const features = detectFirebaseFeatures(initDirResolved);
  
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
        options: { command: 'echo Build succeeded.' }
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
          command: 'npx -y kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299,4000,4400,4500' 
        }
      },
      'emulators:start': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: 'firebase emulators:start --only=functions,firestore,auth --import=./exports' 
        }
      },
      'emulators:debug': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: 'firebase emulators:start --inspect-functions --only=functions,firestore,auth --import=./exports' 
        }
      },
      'emulators:stop': {
        executor: 'nx:run-commands',
        options: { 
          command: 'npx -y kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299,4000,4400,4500' 
        }
      },
      'emulators:export': {
        executor: 'nx:run-commands',
        options: { 
          cwd: projectRoot,
          command: 'firebase emulators:export ./exports --force' 
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
          command: 'firebase deploy --only functions' 
        },
        dependsOn: ['build']
      }
    }
  }, true);

  // Copy Firebase files from init directory to Nx workspace
  copyDirectoryToTree(tree, initDirResolved, projectRoot);
  
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
  console.log(`\n📝 Available Nx targets:`);
  console.log(`   - nx firebase ${firebaseProjectName} --help`);
  console.log(`   - nx emulators:start ${firebaseProjectName}`);
  console.log(`   - nx deploy ${firebaseProjectName}`);
}