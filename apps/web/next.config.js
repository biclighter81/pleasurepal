const path = require("path");
const nextConfig = {
  reactStrictMode: false,
  output: "standalone",
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  env: {
    NEXT_PUBLIC_DISCORD_IDENTIFICATION_URL:
      process.env.NODE_ENV === "production"
        ? "https://discord.com/api/oauth2/authorize?client_id=1073750713928257538&redirect_uri=https%3A%2F%2Fpleasurepal.de%2Fprofile%2Fidentification%2Fdiscord&response_type=code&scope=identify"
        : "https://discord.com/api/oauth2/authorize?client_id=1073750713928257538&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fprofile%2Fidentification%2Fdiscord&response_type=code&scope=identify",
    NEXT_PUBLIC_PLEASUREPAL_API:
      process.env.NODE_ENV === "production"
        ? "https://api.pleasurepal.de"
        : "http://localhost:3001",
    NEXT_PUBLIC_WS_URL:
      process.env.NODE_ENV === "production"
        ? "ws.pleasurepal.de"
        : "localhost:80",
    NEXT_PUBLIC_IS_PRODUCTION:
      process.env.NODE_ENV === "production" ? "true" : "false",
  },
};

module.exports = nextConfig;