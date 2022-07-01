#!/usr/bin/env node

import meow from 'meow';
import createCommand from '../dist/index.js';

const cli = meow(
  `
	Usage
    $ graphql-validate <flags>

	Options
        --help                  Show this help
        --version               Show the version
        
    -c, --config                Path to GraphQL codegen YAML config file, 
                                defaults to a valid graphql-config file
        --schema                Point to a schema
        --documents             Point to documents
    -d, --deprecated            Fail on deprecated usage
        --no-strict-fragments   Do not fail on duplicated fragment names
    -m, --max-depth             Fail on deep operations
        --apollo                Support Apollo directives
        --keep-client-fields    Keeps the fields with @client, but removes 
                                @client directive from them
    -f, --filter                Show results only from a list of files (or file)
    -i, --ignore                Ignore and do not load these files (supports glob)
        --only-errors           Show only errors
        --realtive-paths        Show relative paths
    -s, --silent                Do not print results
    -o, --output                Output JSON file
`,
  {
    importMeta: import.meta,
    inferType: true,
    flags: {
      config: {
        type: 'string',
        alias: 'c',
      },
      schema: {
        type: 'string',
        alias: 's',
      },
      documents: {
        type: 'string',
        alias: 'd',
      },
      deprecated: {
        alias: 'd',
        type: 'boolean',
        default: false,
      },
      noStrictFragments: {
        type: 'boolean',
        default: false,
      },
      maxDepth: {
        type: 'number',
        alias: 'm',
      },
      apollo: {
        type: 'boolean',
        default: false,
      },
      keepClientFields: {
        type: 'boolean',
        default: false,
      },
      filter: {
        type: 'string',
        alias: 'f',
      },
      ignore: {
        type: 'string',
        alias: 'i',
      },
      onlyErrors: {
        type: 'boolean',
        default: false,
      },
      relativePaths: {
        type: 'boolean',
        default: false,
      },
      silent: {
        type: 'boolean',
        default: false,
        alias: 's',
      },
      output: {
        type: 'string',
        alias: 'o',
      },
    },
  },
);

createCommand(cli.flags);

