import path from 'path';
import fs from 'fs-extra';
import * as Nconf from 'nconf';

const nconf: Nconf.Provider = new Nconf.Provider({});
const defaultEnv = process.env.NODE_ENV || 'development';

// command line arguments
nconf.argv();

// override with custom config file
const pathToExternalConfig = `${path.resolve(`.`)}/config`;

// check if we have an external configuration file
const environmentConfig = `${pathToExternalConfig}/config.${defaultEnv}.json`;
if (!fs.existsSync(environmentConfig)) {
  console.error(
    `No external config file found. Please provide environment config file ${environmentConfig}`
  );
  process.exit(-1);
}

// load the given config file
nconf.file('environment', environmentConfig);

// load the defaults
const defaults = require('./defaults.json');
nconf.defaults(defaults);

// values we have to set manual
if (!nconf.get('env')) {
  nconf.set('env', defaultEnv);
}

nconf.set('IS_PROD', nconf.get('env') == 'production');

/**
 * configure the paths for the application
 */
function configurePaths(): void {
  // directory where all content of the project is put
  const pathToRoot = `${process.cwd()}/`;
  const pathToContent = `${process.cwd()}/content`;
  const pathToLogs = `${pathToContent}/logs`;

  // set paths in the configuration
  nconf.set('paths', {
    root: pathToRoot,
    logs: pathToLogs,
    content: pathToContent,
  });
}
configurePaths();

export default nconf;
