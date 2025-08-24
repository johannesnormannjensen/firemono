import { Tree, readJson, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import generator from './firebase-project';
import * as path from 'path';

describe('Firebase Generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add project configuration and generate files', async () => {
    await generator(tree, {
      name: 'my-app',
      directory: 'apps',
      tags: 'feature,test'
    });
  
    const projectJson = readJson(tree, 'apps/apps/my-app/firebase/project.json');
  
    expect(projectJson.projectType).toBe('application');
    expect(projectJson.tags).toEqual(['feature', 'test', 'type:firebase', 'scope:apps-my-app', 'platform:firebase']);
    expect(projectJson.targets.firebase).toBeDefined();
    expect(projectJson.targets['emulators:start']).toBeDefined();
  });

  it.skip('should handle projects without directory and tags', async () => {
    await generator(tree, {
      name: 'anotherApp'
    });

    const projectName = 'another-app-firebase';
    const config = readProjectConfiguration(tree, projectName);

    expect(config.root).toBe('apps/another-app/firebase');
    expect(config.projectType).toBe('application');
    expect(config.tags).toEqual([]);
  });


  it.skip('should generate expected Firebase files', async () => {
    await generator(tree, {
      name: 'my-app',
      directory: 'apps',
      tags: 'firebase,app'
    });
  
    const projectRoot = 'apps/apps/my-app/firebase';
    const projectName = 'apps-my-app-firebase';
    const config = readProjectConfiguration(tree, projectName);
  
    expect(config.root).toBe(projectRoot);
    expect(config.projectType).toBe('application');
    expect(config.tags).toEqual(['firebase', 'app']);
  
    const expectedFiles = [
      'firebase.json',
      'firestore.rules',
      'firestore.indexes.json',
      'database.rules.json',
      'storage.rules',
      // Fjern '.gitignore' hvis du ikke genererer den!
    ];
  
    for (const file of expectedFiles) {
      const filePath = path.join(projectRoot, file);
      if (!tree.exists(filePath)) {
        throw new Error(`❌ Missing file: ${filePath}`);
      }
    }
  });

});
