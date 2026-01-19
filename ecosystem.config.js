
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
    // Worker desactivado para ahorrar RAM y moverlo a servicio externo
    // {
    //   name: 'ceres-platform-v1-worker',
    //   script: 'dist/scripts/worker.js',
    //   ...
    // }
  ],
};
