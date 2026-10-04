import { exportCommand } from './blog-content.mjs';
import { buildStatic } from './build-static.mjs';
try { await exportCommand(process.argv.slice(2)); await buildStatic(); }
catch (error) { console.error(error.message); process.exitCode = 1; }
