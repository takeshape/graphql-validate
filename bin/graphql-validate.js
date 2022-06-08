#!/usr/bin/env node

import meow from 'meow';
import createCommand from '../dist/index.js';

const cli = meow(
  `
	Usage
    $ next-auth-all-access generate-keys <flags>

	Options
    --jwks-path  The path to write your jwks.json file to, defaults to './keys/jwks.json'
`,
  {
    allowUnknownFlags: false,
    importMeta: import.meta,
    input: [
      'generate-keys',
    ],
    flags: {
      schema: {
        describe: 'Point to a schema',
        type: 'string',
      },
      documents: {
        describe: 'Point to documents',
        type: 'string',
      },
      deprecated: {
        alias: 'd',
        describe: 'Fail on deprecated usage',
        type: 'boolean',
        default: false,
      },
      noStrictFragments: {
        describe: 'Do not fail on duplicated fragment names',
        type: 'boolean',
        default: false,
      },
      maxDepth: {
        describe: 'Fail on deep operations',
        type: 'number',
      },
      apollo: {
        describe: 'Support Apollo directives',
        type: 'boolean',
        default: false,
      },
      keepClientFields: {
        describe: 'Keeps the fields with @client, but removes @client directive from them',
        type: 'boolean',
        default: false,
      },
      filter: {
        describe: 'Show results only from a list of files (or file)',
        array: true,
        type: 'string',
      },
      ignore: {
        describe: 'Ignore and do not load these files (supports glob)',
        array: true,
        type: 'string',
      },
      onlyErrors: {
        describe: 'Show only errors',
        type: 'boolean',
        default: false,
      },
      relativePaths: {
        describe: 'Show relative paths',
        type: 'boolean',
        default: false,
      },
      silent: {
        describe: 'Do not print results',
        type: 'boolean',
        default: false,
      },
      output: {
        describe: 'Output JSON file',
        type: 'string',
      },
    },
  },
);

createCommand(cli.flags);

