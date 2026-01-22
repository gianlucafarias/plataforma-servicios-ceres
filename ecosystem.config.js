
module.exports = {
  apps: [
    {
      name: 'ceres-platform-v1-app',
      script: '.next/standalone/server.js',
      cwd: __dirname,
      node_args: '--max-old-space-size=256 --gc-interval=100',
      env: {
        NODE_ENV: 'production',
        PORT: 3012
      }
    }
  ],
};
