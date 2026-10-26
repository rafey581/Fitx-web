// PM2 process definition for the FITX site.
//
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 save && pm2 startup
//
// The app listens on 127.0.0.1:3000 and Nginx terminates TLS in front of it.
// `npm ci` + `npm run build` must have been run first (see DEPLOYMENT.md §5).
//
// Cluster mode: Next.js is safe to run multi-process behind a load balancer,
// but start with one instance and raise `instances` only after load testing
// (each instance opens its own MySQL pool). See DEPLOYMENT.md §12.
module.exports = {
  apps: [
    {
      name: "fitx",
      cwd: __dirname + "/..",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        // Hostname only — Nginx proxies to this and terminates TLS.
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};
