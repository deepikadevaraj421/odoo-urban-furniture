const app = require('./app');
const env = require('./config/env');

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  🏢  Urban Furniture ERP — Backend Server');
  console.log('═══════════════════════════════════════════════');
  console.log(`  ✅  Server running on port ${PORT}`);
  console.log(`  🌐  API URL: http://localhost:${PORT}/api`);
  console.log(`  🏥  Health:  http://localhost:${PORT}/api/health`);
  console.log(`  📦  Environment: ${env.NODE_ENV}`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
});
