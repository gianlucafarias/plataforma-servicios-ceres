module.exports = {
  apps: [
    {
      name: 'ceres-platform-v1-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3012',
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'ceres-platform-v1-worker',
      script: 'dist/scripts/worker.js',
      env_production: {
        NODE_ENV: 'production',
      },
    }
  ],
};
