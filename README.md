# graphql-validate

Validates your project's GraphQL queries. All code was extraced and adapted from
[GraphQL Inspector](https://github.com/kamilkisiela/graphql-inspector).

## Why?

The original code is being updated, and there is no published version that
works with `graphql` v16. This is particularly a problem with `npm` v8 which
throws an error due to peer conflicts.

## Installation

```
$ npm add @takeshape/graphql-validate -D
```

You must have a valid
[graphql-config](https://www.graphql-config.com/docs/user/user-introduction) in
your project root.

## Usage

In your `package.json`, add the following `scripts`:

```json
{
  "graphql-validate": "graphql-validate"
}
```

Then run

```
$ npm run graphql-validate
```

## Options

This supports all the `graphql-cli` options. You can review the code
[here](./bin/graphql-validate.js).

