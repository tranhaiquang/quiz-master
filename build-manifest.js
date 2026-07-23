const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'questions');
const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.json') && f !== 'manifest.json')
  .sort();

fs.writeFileSync(
  path.join(dir, 'manifest.json'),
  JSON.stringify(files, null, 2),
  'utf8'
);

console.log(`manifest.json generated — ${files.length} files`);
