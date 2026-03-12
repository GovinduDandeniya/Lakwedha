try {
  require('./server.js');
} catch (e) {
  const fs = require('fs');
  fs.writeFileSync('error_dump.txt', e.stack);
}
