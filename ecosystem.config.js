module.exports = {
    apps: [
      {
        name: 'plataforma-servicios-ceres',
        script: 'node_modules/next/dist/bin/next',
        args: 'start -p 3012',
        cwd: '/var/www/ceres',
        env: {
          NODE_ENV: 'production'
        }
      }
    ]
  };