import {InspectorConfig} from '@graphql-inspector/config';
import {Loaders} from '@graphql-inspector/loaders';
import {CommandModule as Command} from 'yargs';

export type {Command};

export interface UseCommandsAPI {
  config: InspectorConfig;
  loaders: Loaders;
}

export type CommandFactory<T = Record<string, unknown>, U = Record<string, unknown>> = (api: Required<UseCommandsAPI>) => Command<T, U>;

export function createCommand<T = Record<string, unknown>, U = Record<string, unknown>>(factory: CommandFactory<T, U>) {
  return factory;
}

export interface GlobalArgs {
  require?: string[];
  token?: string;
  header?: string[];
  leftHeader?: string[];
  rightHeader?: string[];
  federation?: boolean;
  aws?: boolean;
  method?: string;
}

export function parseGlobalArgs(args: GlobalArgs) {
  const headers: Record<string, string> = {};
  const leftHeaders: Record<string, string> = {};
  const rightHeaders: Record<string, string> = {};

  if (args.header) {
    args.header.forEach(header => {
      const [name, ...values] = header.split(':');

      headers[name] = values.join('');
    });
  }

  if (args.leftHeader) {
    args.leftHeader.forEach(leftHeader => {
      const [lname, ...lvalues] = leftHeader.split(':');

      leftHeaders[lname] = lvalues.join('');
    });
  }

  if (args.rightHeader) {
    args.rightHeader.forEach(rightHeader => {
      const [rname, ...rvalues] = rightHeader.split(':');

      rightHeaders[rname] = rvalues.join('');
    });
  }

  return {headers, leftHeaders, rightHeaders, token: args.token};
}
