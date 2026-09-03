module.exports = {
  apps : [{
    name: "ches-backend-prod",
    script: "index.js",
    env_production: {
      NODE_ENV: "production",
      PORT: 5000,
      DB_HOST: "localhost",
      DB_USER: "postgres",
      DB_PASSWORD: "Gamaadmin53",
      DB_NAME: "ches_prod",
      DB_PORT: 5432,
      JWT_SECRET: "super_secret_jwt_key_for_ches"
    }
  }]
};
