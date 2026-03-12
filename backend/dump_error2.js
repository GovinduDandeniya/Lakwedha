try {
  require('./src/server.js');
} catch (e) {
  const fs = require('fs');
  fs.writeFileSync('error_dump2.txt', e.stack || e.message);
}
