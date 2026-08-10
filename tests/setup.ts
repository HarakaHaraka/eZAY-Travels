import { config as loadEnv } from 'dotenv';

// Tests run against a dedicated database so a run never touches dev data.
loadEnv({ path: '.env.test', override: true });

// Deterministic pricing config for the markup tests, regardless of .env.
process.env.MARKUP_SHORT_HAUL_PCT ??= '0.05';
process.env.MARKUP_LONG_HAUL_PCT ??= '0.08';
process.env.MARKUP_MIN_PER_TICKET_MINOR ??= '1500';
process.env.MARKUP_PACKAGE_PCT ??= '0.10';
