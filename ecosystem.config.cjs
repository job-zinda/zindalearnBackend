// PM2 Ecosystem Config for Zinda Learn Backend on AWS EC2
// Usage:
//   Start:   pm2 start ecosystem.config.cjs --env production
//   Restart: pm2 restart zinda-learn-api
//   Save:    pm2 save   (to auto-restart on server reboot)
//   Startup: pm2 startup  (to enable auto-restart on system boot)
module.exports = {
  apps: [
    {
      name: 'zinda-learn-api',
      script: 'server.js',

      // 'fork' mode is required for Socket.IO — 'cluster' mode doesn't work
      // with Socket.IO unless you use a Redis adapter (which adds complexity)
      exec_mode: 'fork',
      instances: 1,

      autorestart: true,
      watch: false,

      // Restart if memory exceeds 512MB (prevents memory leaks from killing the server)
      max_memory_restart: '512M',

      // ESM support — Node 18+ handles .js ESM natively, no flag needed
      // If you see "require is not defined" errors, uncomment this:
      // interpreter_args: '--experimental-vm-modules',

      // Combine stdout + stderr into a single log stream for easier EC2 log tailing
      combine_logs: true,
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      env: {
        NODE_ENV: 'development',
        PORT: 5005,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5005,
        // All secrets are loaded from the .env file on EC2 via dotenv
        // or injected directly via PM2 ecosystem env_production block
        // Recommended: set them in .env on EC2, NOT hardcoded here
      },
    },
  ],
};
