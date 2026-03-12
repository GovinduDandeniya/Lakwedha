const cp = require('child_process');
const path = require('path');

const out = cp.execSync('git diff --name-only').toString();
const files = out.split('\n').map(f => f.trim()).filter(Boolean);

let count = 0;
for (const file of files) {
  if (file.includes('react') || file.includes('app.js')) continue; // ensure we just commit the color files, wait, let's be careful. Let's just commit the known files.
  if (!file.endsWith('.dart') && !file.endsWith('.jsx') && !file.endsWith('.tsx') && !file.endsWith('.css') && !file.endsWith('tailwind.config.js')) continue;

  console.log('Committing ' + file);
  cp.execSync(`git add "${file}"`);
  cp.execSync(`git commit -m "matched colors to team palette in ${path.basename(file)}"`);
  count++;

  if (count % 3 === 0) {
    console.log('Pushing ' + count);
    try {
      cp.execSync(`git push origin pharmacy`);
    } catch (e) {
      console.log('Push error: ' + e.message);
    }
  }
}

if (count % 3 !== 0) {
  try {
    cp.execSync(`git push origin pharmacy`);
  } catch (e) {
    console.log('Push error: ' + e.message);
  }
}
console.log('Done committing ' + count + ' files.');
