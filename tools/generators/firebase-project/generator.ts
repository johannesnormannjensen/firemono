import { Tree, addProjectConfiguration, generateFiles, names, joinPathFragments, formatFiles } from '@nx/devkit';
import { join } from 'path';

interface Schema {
  name: string;
  directory?: string;
  tags?: string;
}

export default async function (tree: Tree, schema: Schema) {
  const nameParts = names(schema.name);
  const projectDir = schema.directory
    ? `${names(schema.directory).fileName}/${nameParts.fileName}`
    : nameParts.fileName;
  const projectName = `${projectDir.replace(/\//g, '-')}-firebase`;
  const projectRoot = joinPathFragments('apps', projectDir, 'firebase');
  const parsedTags = schema.tags ? schema.tags.split(',').map(s => s.trim()) : [];

  addProjectConfiguration(tree, projectName, {
    root: projectRoot,
    projectType: 'application',
    tags: parsedTags,
    implicitDependencies: [],
    targets: {
      build: {
        executor: 'nx:run-commands',
        options: { command: 'echo Build succeeded.' }
      },
      watch: {
        executor: 'nx:run-commands',
        options: { command: `nx run-many --targets=build --projects=tag:${projectName}:dep:${projectName} --parallel=100 --watch` }
      },
      lint: {
        executor: 'nx:run-commands',
        options: { command: `nx run-many --targets=lint --projects=tag:${projectName}:dep:${projectName} --parallel=100` }
      },
      test: {
        executor: 'nx:run-commands',
        options: { command: `nx run-many --targets=test --projects=tag:${projectName}:dep:${projectName} --parallel=100` }
      },
      firebase: {
        executor: 'nx:run-commands',
        options: { command: 'firebase --config=firebase.json' },
        configurations: { production: { command: 'firebase --config=firebase.json' } }
      },
      killports: {
        executor: 'nx:run-commands',
        options: { command: 'kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299,4000,4400,4500' }
      },
      getconfig: {
        executor: 'nx:run-commands',
        options: { command: `nx run ${projectName}:firebase functions:config:get > ${projectRoot}/.runtimeconfig.json` }
      },
      emulate: {
        executor: 'nx:run-commands',
        options: { commands: [`nx run ${projectName}:killports`], parallel: false }
      },
      serve: {
        executor: 'nx:run-commands',
        options: { commands: [`nx run ${projectName}:watch`] }
      },
      deploy: {
        executor: 'nx:run-commands',
        dependsOn: ['build'],
        options: { command: `nx run ${projectName}:firebase deploy` }
      }
    }
  }, true);

  // Generate files
  const templateOptions = {
    ...nameParts,
    projectDir,
    tmpl: ''
  };
  generateFiles(tree, join(__dirname, 'files'), projectRoot, templateOptions);

  await formatFiles(tree);
}