import { Tree, readJson, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import generator from './firebase-project';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

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
      directory: 'projects',
      initDir: tempInitDir
    });
  
    const projectJson = readJson(tree, 'apps/projects/firebase/project.json');
  
    expect(projectJson.projectType).toBe('application');
    expect(projectJson.name).toBe('projects-firebase');
    expect(projectJson.tags).toEqual([
      'type:firebase', 
      'scope:projects', 
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
    expect(tree.exists('apps/projects/firebase/firebase.json')).toBe(true);
    expect(tree.exists('apps/projects/firebase/.firebaserc')).toBe(true);
    expect(tree.exists('apps/projects/firebase/firestore.rules')).toBe(true);
    
    // Verify firebase.json content was copied correctly
    const copiedFirebaseJson = readJson(tree, 'apps/projects/firebase/firebase.json');
    expect(copiedFirebaseJson.functions).toBeDefined();
    expect(copiedFirebaseJson.firestore).toBeDefined();
  });

  it('should handle projects without directory parameter', async () => {
    await generator(tree, {
      name: 'standalone-app',
      initDir: tempInitDir
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

  it('should throw error if initDir does not exist', async () => {
    await expect(generator(tree, {
      name: 'test-app',
      initDir: '/nonexistent/path'
    })).rejects.toThrow('Init directory does not exist');
  });

  it('should throw error if initDir has no firebase.json', async () => {
    const emptyDir = join(tmpdir(), `empty-dir-${Date.now()}`);
    mkdirSync(emptyDir, { recursive: true });
    
    try {
      await expect(generator(tree, {
        name: 'test-app',
        initDir: emptyDir
      })).rejects.toThrow('No firebase.json found');
    } finally {
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

});
