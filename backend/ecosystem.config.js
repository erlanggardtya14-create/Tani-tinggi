/**
 * PM2 Ecosystem Configuration for Tani Tinggi
 *
 * Manages two processes:
 * 1. tanitinggi-api: Fastify HTTP server (cluster mode, 2 instances)
 * 2. tanitinggi-worker: BullMQ workers (single instance, needs shared memory for AI model)
 */
module.exports = {
  apps: [
    {
      name: 'tanitinggi-api',
      script: 'dist/app.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // Logging
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Restart policy
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
    {
      name: 'tanitinggi-worker',
      script: 'dist/workers/index.js',
      instances: 1,              // Single instance: AI model shares memory
      exec_mode: 'fork',
      max_memory_restart: '900M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 10000,       // Give workers more time to finish jobs
    },
  ],
};
