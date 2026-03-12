const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (!full.includes('node_modules') && !full.includes('.git') && !full.includes('.dart_tool') && !full.includes('build')) {
        filelist = walkSync(full, filelist);
      }
    } else {
      filelist.push(full);
    }
  });
  return filelist;
}

const files = walkSync('c:\\Users\\Mubarak\\Desktop\\Lakwedha');
let fixed = 0;

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('<<<<<<< HEAD')) continue;

    // Replace all conflict blocks, keeping HEAD content
    const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> origin\/pharmacy\r?\n/g;
    const newContent = content.replace(regex, '$1');

    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log('Fixed: ' + file);
      fixed++;
    }
  } catch(e) {
    // skip binary files
  }
}

console.log(`\nTotal files fixed: ${fixed}`);
