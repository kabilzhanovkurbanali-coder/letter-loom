module.exports = {
  apps: [
    {
      name: 'letter-loom',
      script: 'index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 2000,
      env: {
        NODE_ENV: 'production'
      },
      log_file: './server.log',
      out_file: './server.log',
      error_file: './server.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
