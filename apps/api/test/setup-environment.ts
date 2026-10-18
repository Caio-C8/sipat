process.env.NODE_ENV = "test";
process.env.APP_ENV = "test";
process.env.AUTH_RATE_LIMIT_HMAC_SECRET ??=
  "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY";
process.env.AUTH_ARGON2_MAX_CONCURRENCY ??= "1";
process.env.AUTH_ARGON2_MAX_QUEUE ??= "2";
process.env.DATABASE_URL ??=
  "postgresql://test:test@localhost:5432/test?schema=public";
