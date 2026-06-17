module.exports = {
  apps: [
    {
      name: "mapfactbook",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "4G",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "file:./prisma/prod.db",
        NEXT_PUBLIC_MAP_STYLE_MODE: "dark",
        NEXT_PUBLIC_CESIUM_BASE_URL: "/vendor/cesium",
      },
    },
  ],
};
