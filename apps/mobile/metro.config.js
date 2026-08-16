const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from mobile node_modules first, then root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Exclude web app to prevent EMFILE (too many open files) on Windows
if (!Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList = config.resolver.blockList ? [config.resolver.blockList] : [];
}
config.resolver.blockList.push(
  new RegExp(path.resolve(workspaceRoot, "apps/web").replace(/\\/g, '\\\\') + '/.*')
);

module.exports = config;
