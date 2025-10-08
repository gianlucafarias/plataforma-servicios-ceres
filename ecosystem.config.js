module.exports = {
    apps: [
      {
        name: 'plataforma-servicios-ceres',
        script: 'node_modules/next/dist/bin/next',
        args: 'start',
        cwd: '/var/www/plataforma-servicios-ceres',
        env_file: '/var/www/plataforma-servicios-ceres/.env',
        env: {
          NODE_ENV: 'production', PORT: 3012
        },
        instances: 'max',
        exec_mode: 'cluster',
        watch: false,
        out_file: '/var/log/pm2/plataforma-servicios-ceres-out.log',
        error_file: '/var/log/pm2/plataforma-servicios-ceres-err.log',
        merge_logs: true,
        max_memory_restart: '600M'
      },
      {
        name: 'ceres-worker',
        script: 'npm',
        args: 'run worker:start',
        cwd: '/var/www/plataforma-servicios-ceres',
        env_file: '/var/www/plataforma-servicios-ceres/.env',
        env: {
          NODE_ENV: 'production'
        },
        instances: 1,
        exec_mode: 'fork',
        watch: false,
        out_file: '/var/log/pm2/ceres-worker-out.log',
        error_file: '/var/log/pm2/ceres-worker-err.log',
        merge_logs: true,
        max_memory_restart: '400M'
      },
      {
        name: 'ceres-queues-ui',
        script: 'npm',
        args: 'run queues:ui:start',
        cwd: '/var/www/plataforma-servicios-ceres',
        env_file: '/var/www/plataforma-servicios-ceres/.env',
        env: {
          NODE_ENV: 'production'
        },
        instances: 1,
        exec_mode: 'fork',
        watch: false,
        out_file: '/var/log/pm2/ceres-queues-ui-out.log',
        error_file: '/var/log/pm2/ceres-queues-ui-err.log',
        merge_logs: true,
        max_memory_restart: '200M'
      }
    ]
  };