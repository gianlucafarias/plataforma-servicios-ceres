module.exports = {
  apps: [
    {
      name: 'ceres-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3012',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'ceres-worker',
      script: 'dist/scripts/worker.js',
      env: {
        NODE_ENV: 'production',
      },
    }
  ],
};
