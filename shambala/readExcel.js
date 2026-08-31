const xlsx = require('xlsx');
const path = require('path');

const filePath = path.resolve('../EXPENDITURE 2025.xlsx');
try {
  const workbook = xlsx.readFile(filePath);
  console.log("Sheet names:", workbook.SheetNames);
  
  // Dump a bit of data from each sheet
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
  }
} catch (err) {
  console.error("Error reading file:", err);
}
