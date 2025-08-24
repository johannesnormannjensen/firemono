import { Tree, addProjectConfiguration, generateFiles, names, joinPathFragments, formatFiles } from '@nx/devkit';
import { join } from 'path';

import { GeneratorOptions } from './schema';

type Schema = GeneratorOptions;

export default async function (tree: Tree, schema: Schema) {
  const nameParts = names(schema.name);
  const projectDir = schema.directory ? `${names(schema.directory).fileName}/${nameParts.fileName}` : nameParts.fileName;
  
  // Improved naming strategy - consistent with Nx conventions
  const baseProjectName = projectDir.replace(/\//g, '-');
  const firebaseProjectName = `${baseProjectName}-firebase`;
  const functionsProjectName = `${baseProjectName}-functions`;
  const angularProjectName = `${baseProjectName}-angular`;
  
  const projectRoot = joinPathFragments('apps', projectDir, 'firebase');
  const parsedTags = schema.tags ? schema.tags.split(',').map(s => s.trim()) : [];
  
  // Enhanced tagging strategy following Nx best practices
  const projectTags = [
    ...parsedTags,
    `type:firebase`,                    // Marks this as Firebase infrastructure project
    `scope:${baseProjectName}`,        // Groups related projects by feature/domain
    `platform:firebase`                // Indicates deployment platform
  ];

  // Add Firebase project configuration based on demo-firebase pattern
  addProjectConfiguration(tree, firebaseProjectName, {
    root: projectRoot,
    projectType: 'application',
    tags: projectTags,
    implicitDependencies: [functionsProjectName],
    targets: {
      build: {
        executor: 'nx:run-commands',
        options: { command: 'echo Build succeeded.' }
      },
      watch: {
        executor: 'nx:run-commands',
        options: { 
          command: `nx watch --projects=${firebaseProjectName},${functionsProjectName} -- nx build ${firebaseProjectName}` 
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
      'test-watch': {
        executor: 'nx:run-commands',
        options: { 
          command: `nx watch --projects=tag:scope:${baseProjectName} -- nx run-many --target=test --projects=tag:scope:${baseProjectName}` 
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
          command: `firebase deploy --only functions:${functionsProjectName}` 
        },
        dependsOn: ['build']
      }
    }
  }, true);

  // Generate files from templates
  const templateOptions = {
    ...nameParts,
    projectName: nameParts.fileName,
    baseProjectName,
    firebaseProjectName,
    functionsProjectName, 
    angularProjectName,
    projectDir,
    tags: parsedTags,
    tmpl: '',
  };
  
  generateFiles(tree, join(__dirname, 'files'), projectRoot, templateOptions);

  await formatFiles(tree);
}