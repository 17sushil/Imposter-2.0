const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * The app and the website read one copy of the game configuration from
 * `packages/shared-types`. Metro does not know about tsconfig `paths`, so the two aliases
 * are mapped here by hand, and the package folder is added to the watch list so editing a
 * word in the shared file reloads the app instead of silently doing nothing.
 */
const sharedGame = path.resolve(__dirname, '../../packages/shared-types/src');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@shared/game': sharedGame,
  // contract.ts is a single file, so the alias points straight at its folder
  '@shared/contract': path.join(sharedGame, 'contract.ts'),
};
config.watchFolders = [path.resolve(__dirname, '../../packages'), ...(config.watchFolders ?? [])];

/**
 * `tsconfig.json` pins `react` to the app's own `@types/react` so the type checker stops
 * picking up the website's React 19 declarations (that mismatch is what made every screen
 * fail with "not a valid JSX element type").
 *
 * Metro reads tsconfig `paths` too, and would then try to *bundle* `@types/react` — which
 * is types only, so the bundle dies with "package specifies a main field that could not be
 * resolved". This puts the runtime back on the real `react` package; the type alias stays
 * for tsc only.
 */
const appReact = require.resolve('react', { paths: [__dirname] });
const previousResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react') {
    return { type: 'sourceFile', filePath: appReact };
  }
  if (previousResolve) return previousResolve(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/styles/global.css' });
