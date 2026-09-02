const fs = require('fs');
const path = require('path');

const inputPath = 'C:\\Users\\akash\\.gemini\\antigravity-ide\\brain\\e9494e92-e87a-4ca0-82e0-72522f5305f4\\.system_generated\\steps\\578\\output.txt';
const outputPath = path.join(__dirname, 'src', 'lib', 'database.types.ts');

try {
  const content = fs.readFileSync(inputPath, 'utf8');
  const json = JSON.parse(content);
  fs.writeFileSync(outputPath, json.types);
  console.log('Successfully wrote database types to', outputPath);
} catch (err) {
  console.error('Failed to parse or write types', err);
}
