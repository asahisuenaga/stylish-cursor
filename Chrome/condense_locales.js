const fs = require('fs');
const path = require('path');

const localesDir = '_locales';
const localeDirs = fs.readdirSync(localesDir).filter(dir =>
  fs.statSync(path.join(localesDir, dir)).isDirectory()
);

localeDirs.forEach(locale => {
  const filePath = path.join(localesDir, locale, 'messages.json');
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // Write compact JSON: one line per translation
      const lines = Object.entries(data).map(([key, value]) =>
        `  "${key}": ${JSON.stringify(value)}`
      );
      const compact = `{
${lines.join(',\n')}
}`;
      fs.writeFileSync(filePath, compact);
      console.log(`Condensed: ${filePath}`);
    } catch (e) {
      console.error(`Error processing ${filePath}:`, e.message);
    }
  }
});
console.log('All locale files condensed.'); 