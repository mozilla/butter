// This configuration file is necessary until the upstream bug is fixed:
// https://github.com/newrelic/node-newrelic/issues/6

exports.config = {
  logging: {
    filepath: 'stdout'
  }
};
