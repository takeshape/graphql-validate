/* eslint-disable no-console */
import chalk from 'chalk';
import figures from 'figures';
import symbols from 'log-symbols';
import {hasTTY} from 'std-env';

export {chalk, symbols, figures};

export function bolderize(msg: string): string {
  const findSingleQuotes = /'([^']+)'/gim;
  const findDoubleQuotes = /"([^"]+)"/gim;

  return msg
    .replace(findSingleQuotes, (_: string, value: string) => chalk.bold(value))
    .replace(findDoubleQuotes, (_: string, value: string) => chalk.bold(value));
}

let mockedFn: ((msg: string) => void) | undefined = null;

const canBeFancy = hasTTY;

export interface Logger {
  success(msg: string): void;
  log(msg: string): void;
  info(msg: string): void;
  error(msg: string): void;
  warn(msg: string): void;
}

export const logger = {
  success(msg: string) {
    emit('success', msg);
  },
  log(msg: string) {
    emit('log', msg);
  },
  info(msg: string) {
    emit('info', msg);
  },
  error(msg: string) {
    emit('error', msg);
  },
  warn(msg: string) {
    emit('warn', msg);
  },
};

export function mockLogger(fn: (msg: string) => void) {
  mockedFn = fn;
}

export function unmockLogger() {
  mockedFn = null;
}

function emit(type: 'success' | 'info' | 'log' | 'error' | 'warn', msg: string) {
  if (mockedFn) {
    mockedFn(msg);
    return;
  }

  if (!canBeFancy) {
    console.log(`[${type}]`, msg);
    return;
  }

  if (type === 'success') {
    emitSuccess(msg);
  } else if (type === 'error') {
    emitError(msg);
  } else if (type === 'info') {
    emitInfo(msg);
  } else if (type === 'warn') {
    emitWarn(msg);
  } else {
    console.log(msg);
  }
}

function emitSuccess(msg: string) {
  console.log(chalk.green('success'), msg);
}

function emitError(msg: string) {
  console.log(chalk.red('error'), msg);
}

function emitInfo(msg: string) {
  console.log(chalk.blue('info'), msg);
}

function emitWarn(msg: string) {
  console.log(chalk.yellow('warning'), msg);
}
