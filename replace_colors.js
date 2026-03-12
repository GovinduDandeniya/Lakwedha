const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules') && !dirFile.includes('.git') && !dirFile.includes('.dart_tool') && !dirFile.includes('build')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.dart') || dirFile.endsWith('.jsx') || dirFile.endsWith('.tsx') || dirFile.endsWith('.css') || dirFile.endsWith('.js') || dirFile.endsWith('.html')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
}

const files = walkSync('c:\\Users\\Mubarak\\Desktop\\Lakwedha');

const replacements = [
  // Flutter
  [/AppTheme\.herbalDeep/g, 'AppTheme.primaryColor'],
  [/AppTheme\.herbal/g, 'AppTheme.primaryColor'],
  [/AppTheme\.earthLight/g, 'AppTheme.secondaryColor'],
  [/AppTheme\.earth/g, 'AppTheme.secondaryColor'],
  [/AppTheme\.turmericDeep/g, 'AppTheme.accentColor'],
  [/AppTheme\.turmeric/g, 'AppTheme.accentColor'],
  [/AppTheme\.sand/g, 'AppTheme.backgroundColor'],
  [/AppTheme\.clay/g, 'AppTheme.backgroundColor'],

  // Web Classes (Tailwind)
  [/\bherbal\b/g, 'primary'],
  [/\bearth\b/g, 'secondary'],
  [/\bturmeric\b/g, 'accent'],
  [/\bsand\b/g, 'background'],
  [/\bclay\b/g, 'background'],
];

files.forEach(file => {
  if (file.includes('app_theme.dart') || file.includes('tailwind.config.js') || file.includes('replace_colors.js')) return;

  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  replacements.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated: ' + file);
  }
});

const twPath = 'c:\\Users\\Mubarak\\Desktop\\Lakwedha\\web\\frontend\\tailwind.config.js';
if (fs.existsSync(twPath)) {
  let tw = fs.readFileSync(twPath, 'utf8');
  tw = tw.replace(/earth: ['"]#5D4037['"],?\s*turmeric: ['"]#FFB300['"],?\s*herbal: ['"]#2E7D32['"],?\s*sand: ['"]#FFF8E1['"],?\s*clay: ['"]#D7CCC8['"],?/g, "primary: '#0D5C3E',\n        secondary: '#D4AF37',\n        accent: '#28A745',\n        emergency: '#DC3545',\n        background: '#F8F9FA',");
  fs.writeFileSync(twPath, tw, 'utf8');
  console.log('Updated: tailwind.config.js');
}
