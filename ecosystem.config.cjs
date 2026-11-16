// pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "elipse-kids-api",
      script: "src/server.js",
      cwd: __dirname,
      instances: 1,            // rate limiter and uploads are per-process, keep 1
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "400M",
      env: { NODE_ENV: "production" }, // PORT and the rest come from .env
    },
  ],
};
