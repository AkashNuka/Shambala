const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const PROJECT_ID = '10000000-0000-0000-0000-000000000000';

async function seed() {
  const filePath = path.resolve(__dirname, '../../EXPENDITURE 2025.xlsx');
  const workbook = xlsx.readFile(filePath);
  
  const names = new Set();

  // Extract from PAY MENTS
  if (workbook.Sheets['PAY MENTS']) {
    const sheet = workbook.Sheets['PAY MENTS'];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (data[3]) {
      data[3].forEach(cell => {
        if (cell && typeof cell === 'string') {
          let name = cell.replace(/PG NO\s*\d+/i, '').replace(/PG NP\s*\d+/i, '').trim();
          if (name && name !== 'TOTAL CASH') {
            names.add(name);
          }
        }
      });
    }
  }

  // Extract from IN PUT
  if (workbook.Sheets['IN PUT']) {
    const sheet = workbook.Sheets['IN PUT'];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (data[2]) {
      data[2].forEach(cell => {
        if (cell && typeof cell === 'string') {
          let name = cell.replace(/CASH/i, '').trim();
          if (name && name !== 'SNO' && name !== 'DATE' && name !== 'CASH AMOUNT') {
            names.add(name);
          }
        }
      });
    }
  }

  const parties = Array.from(names).map(name => ({
    project_id: PROJECT_ID,
    name: name,
    class: 'person', // default to person
    is_active: true
  }));

  console.log(`Found ${parties.length} unique parties to insert:`);
  console.log(parties.map(p => p.name).join(', '));

  // Insert into Supabase
  const { data, error } = await supabase
    .from('parties')
    .insert(parties)
    .select();

  if (error) {
    console.error('Error inserting parties:', error);
  } else {
    console.log(`Successfully inserted ${data.length} parties.`);
  }
}

seed();
