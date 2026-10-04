import { exportCommand } from './blog-content.mjs';
try { await exportCommand(process.argv.slice(2)); }
catch (error) { console.error(error.message); process.exitCode = 1; }
