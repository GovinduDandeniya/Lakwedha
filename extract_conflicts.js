const fs = require('fs');

const files = [
  'backend/src/app.js',
  'backend/src/controllers/orderController.js',
  'backend/src/controllers/pharmacyController.js',
  'backend/src/controllers/user.controller.js',
  'backend/src/models/Order.js',
  'backend/src/models/Prescription.js',
  'backend/src/models/user.js',
  'backend/src/routes/orderRoutes.js',
  'web/frontend/src/utils/api.js',
  'web/frontend/src/components/pharmacy/PrescriptionReviewModal.jsx',
  'web/frontend/src/components/pharmacy/OrderDetailsModal.jsx',
  'web/frontend/src/components/DevAuthTrigger.jsx'
];

let output = '';
for (const file of files) {
  if (fs.existsSync(file)) {
    const text = fs.readFileSync(file, 'utf8');
    const regex = /<<<<<<< HEAD[\s\S]*?>>>>>>> origin\/pharmacy/g;
    let match;
    let found = false;
    while ((match = regex.exec(text)) !== null) {
      if (!found) {
        output += `\n--- ${file} ---\n`;
        found = true;
      }
      output += match[0] + '\n\n';
    }
  }
}

fs.writeFileSync('conflicts_out.txt', output);
