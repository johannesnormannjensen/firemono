import { Tree, readJson, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import generator from './init';

describe('Firebase Generator', () => {
  let tree: Tree;
  let tempInitDir: string;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Create a temp directory with mock firebase.json for testing
    tempInitDir = join(tmpdir(), `test-firebase-init-${Date.now()}`);
    mkdirSync(tempInitDir, { recursive: true });

    // Create mock firebase.json with various features
    const mockFirebaseConfig = {
      functions: [{ source: 'functions', codebase: 'default' }],
      firestore: { rules: 'firestore.rules', indexes: 'firestore.indexes.json' },
      hosting: { public: 'public' },
      storage: { rules: 'storage.rules' },
      emulators: { functions: { port: 5001 }, firestore: { port: 8080 } }
    };

    writeFileSync(join(tempInitDir, 'firebase.json'), JSON.stringify(mockFirebaseConfig, null, 2));
    writeFileSync(join(tempInitDir, '.firebaserc'), JSON.stringify({ projects: { default: 'test-project' } }));
    writeFileSync(join(tempInitDir, 'firestore.rules'), 'rules_version = "2";\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if false;\n    }\n  }\n}');
  });

  afterEach(() => {
    // Clean up temp directory
    if (tempInitDir) {
      rmSync(tempInitDir, { recursive: true, force: true });
    }
  });

  it('should integrate Firebase project and generate proper configuration', async () => {
    await generator(tree, {
      name: 'my-app',
      directory: 'apps/my-app',
      initDirectory: tempInitDir
    });

    const projectJson = readJson(tree, 'apps/my-app/firebase/project.json');

    expect(projectJson.projectType).toBe('application');
    expect(projectJson.name).toBe('my-app-firebase');
    expect(projectJson.tags).toEqual([
      'type:firebase',
      'scope:my-app',
      'platform:firebase',
      'feature:functions',
      'feature:firestore',
      'feature:hosting',
      'feature:storage',
      'feature:emulators'
    ]);
    expect(projectJson.targets.firebase).toBeDefined();
    expect(projectJson.targets['emulators:start']).toBeDefined();
    expect(projectJson.targets.deploy).toBeDefined();

    // Check that Firebase files were copied
    expect(tree.exists('apps/my-app/firebase/firebase.json')).toBe(true);
    expect(tree.exists('apps/my-app/firebase/.firebaserc')).toBe(true);
    expect(tree.exists('apps/my-app/firebase/firestore.rules')).toBe(true);

    // Verify firebase.json content was copied correctly
    const copiedFirebaseJson = readJson(tree, 'apps/my-app/firebase/firebase.json');
    expect(copiedFirebaseJson.functions).toBeDefined();
    expect(copiedFirebaseJson.firestore).toBeDefined();
  });

  it('should handle projects without directory parameter (defaults to apps)', async () => {
    await generator(tree, {
      name: 'standalone-app',
      initDirectory: tempInitDir
    });

    const projectName = 'standalone-app-firebase';
    const config = readProjectConfiguration(tree, projectName);

    expect(config.root).toBe('apps/standalone-app/firebase');
    expect(config.projectType).toBe('application');
    expect(config.tags).toContain('type:firebase');
    expect(config.tags).toContain('scope:standalone-app');
    expect(config.tags).toContain('platform:firebase');

    // Should still detect features from firebase.json
    expect(config.tags).toContain('feature:functions');
    expect(config.tags).toContain('feature:firestore');
  });

  it('should work with custom directory', async () => {
    await generator(tree, {
      name: 'custom-app',
      directory: 'libs/custom-app',
      initDirectory: tempInitDir
    });

    const projectName = 'custom-app-firebase';
    const config = readProjectConfiguration(tree, projectName);

    expect(config.root).toBe('libs/custom-app/firebase');
    expect(config.projectType).toBe('application');
  });

  it('should throw error if initDirectory does not exist', async () => {
    await expect(generator(tree, {
      name: 'test-app',
      initDirectory: '/nonexistent/path'
    })).rejects.toThrow('Init directory does not exist');
  });

  it('should throw error if initDirectory has no firebase.json', async () => {
    const emptyDir = join(tmpdir(), `empty-dir-${Date.now()}`);
    mkdirSync(emptyDir, { recursive: true });

    try {
      await expect(generator(tree, {
        name: 'test-app',
        initDirectory: emptyDir
      })).rejects.toThrow('No firebase.json found');
    } finally {
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('should create functions app with valid ESLint config when functions are detected', async () => {
    // Create functions directory structure in temp init dir
    const functionsDir = join(tempInitDir, 'functions');
    mkdirSync(functionsDir, { recursive: true });
    mkdirSync(join(functionsDir, 'src'), { recursive: true });

    // Add package.json and tsconfig to functions directory
    writeFileSync(join(functionsDir, 'package.json'), JSON.stringify({
      name: 'functions',
      engines: { node: '18' },
      main: 'lib/index.js',
      dependencies: {
        'firebase-admin': '^12.1.0',
        'firebase-functions': '^5.0.1'
      }
    }, null, 2));

    writeFileSync(join(functionsDir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        module: 'commonjs',
        outDir: 'lib',
        target: 'es2018'
      }
    }, null, 2));

    // Add sample functions code
    writeFileSync(join(functionsDir, 'src', 'index.ts'), `
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
`);

    await generator(tree, {
      name: 'test-app',
      directory: 'apps/test-app',
      initDirectory: tempInitDir
    });

    // Verify the functions app was created
    const functionsAppProjectJson = readJson(tree, 'apps/test-app/functions/project.json');
    expect(functionsAppProjectJson.name).toBe('test-app-functions');
    expect(functionsAppProjectJson.targets.build).toBeDefined();
    expect(functionsAppProjectJson.targets.lint).toBeDefined();
    expect(functionsAppProjectJson.targets.test).toBeDefined();

    // Verify ESLint config is generated and has valid syntax
    const eslintConfig = tree.read('apps/test-app/functions/eslint.config.mjs', 'utf8');
    expect(eslintConfig).toBeDefined();
    expect(eslintConfig).toContain("import baseConfig from '../../../eslint.config.mjs';");
    expect(eslintConfig).toContain("import jsoncParser from 'jsonc-eslint-parser';");
    expect(eslintConfig).toContain("parser: jsoncParser,");

    // The critical test: ensure there's no 'await import' which caused the syntax error
    expect(eslintConfig).not.toContain('await import');

    // Verify functions source was processed correctly
    const functionsIndex = tree.read('apps/test-app/functions/src/index.ts', 'utf8');
    expect(functionsIndex).toBeDefined();
    expect(functionsIndex).toContain('export const helloWorld = onRequest');
    expect(functionsIndex).not.toContain('// export const helloWorld');

    // Verify firebase.json was updated to point to dist directory
    const firebaseJson = readJson(tree, 'apps/test-app/firebase/firebase.json');
    expect(firebaseJson.functions[0].source).toBe('../../../dist/test-app/functions');
  });

});
