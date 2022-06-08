import {ApolloEngineLoader} from '@graphql-tools/apollo-engine-loader';
import {CodeFileLoader} from '@graphql-tools/code-file-loader';
import {GitLoader} from '@graphql-tools/git-loader';
import {GithubLoader} from '@graphql-tools/github-loader';
import {GraphQLFileLoader} from '@graphql-tools/graphql-file-loader';
import {loadDocuments, loadSchema} from '@graphql-tools/load';
import {PrismaLoader} from '@graphql-tools/prisma-loader';
import {UrlLoader} from '@graphql-tools/url-loader';
import {Loader} from '@graphql-tools/utils';

export const loaderList: Loader[] = [
  new ApolloEngineLoader(),
  new CodeFileLoader(),
  new GitLoader(),
  new GithubLoader(),
  new PrismaLoader(),
  new UrlLoader(),
  new GraphQLFileLoader()
];

type PointerOf<T extends (...args: any) => any> = Parameters<T>[0];
type OptionsOf<T extends (...args: any) => any> = Omit<Parameters<T>[1], 'loaders'>;
type CreateLoaderOptions = {
  loaders: Loader[];
};

export default function createLoader(loaderOptions?: CreateLoaderOptions) {
  const loaders = loaderOptions?.loaders ?? loaderList;
  return {
    async loadDocuments(pointer: PointerOf<typeof loadDocuments>, options: OptionsOf<typeof loadDocuments>) {
      return loadDocuments(pointer, {loaders, ...options});
    },
    async loadSchema(pointer: PointerOf<typeof loadSchema>, options: OptionsOf<typeof loadSchema>) {
      return loadSchema(pointer, {loaders, ...options});
    },
  };
}
