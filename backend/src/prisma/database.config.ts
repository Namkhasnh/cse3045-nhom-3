export function databaseConfig(value = process.env.DATABASE_URL) {
  if (!value) {
    throw new Error('DATABASE_URL is required. Configure it in backend/.env.');
  }

  try {
    const url = new URL(value);
    const database = decodeURIComponent(url.pathname.slice(1));
    const user = decodeURIComponent(url.username);
    const port = Number(url.port || 3306);
    if (
      url.protocol !== 'mysql:' || !url.hostname || !user || !database ||
      database.includes('/') || url.search || url.hash ||
      !Number.isInteger(port) || port < 1 || port > 65535
    ) {
      throw new Error();
    }
    return {
      host: url.hostname,
      port,
      user,
      password: decodeURIComponent(url.password),
      database,
      // Local MySQL caching_sha2_password needs RSA key retrieval without TLS.
      allowPublicKeyRetrieval: ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
      connectionLimit: 5,
      connectTimeout: 5000,
      acquireTimeout: 10000,
    };
  } catch {
    throw new Error(
      'Invalid DATABASE_URL. Use mysql://user:password@host:port/database without query parameters; URL-encode credentials.',
    );
  }
}
