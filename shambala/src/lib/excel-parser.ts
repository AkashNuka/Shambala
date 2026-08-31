import * as XLSX from 'xlsx';

// ============================================================
// TYPES
// ============================================================

export interface ParsedRow {
  sheetName: string;
  rowNumber: number;
  rawData: Record<string, unknown>;
  parsedData: {
    date?: string;
    amount?: number;
    description?: string;
    category?: string;
    categoryId?: string;
    party?: string;
    type?: string;
    paymentMethod?: string;
    quantity?: number;
    unit?: string;
    rate?: number;
  };
  status: 'auto' | 'review' | 'rejected';
  confidence: number;
  reason: string;
}

export interface ParseResult {
  total: number;
  auto: number;
  review: number;
  rejected: number;
  rows: ParsedRow[];
}

// ============================================================
// SHEET TYPE DETECTION
// ============================================================

type SheetType = 'expenditure' | 'cash_input' | 'salary' | 'payment' | 'material' | 'unknown';

function detectSheetType(sheetName: string, headers: string[]): SheetType {
  const name = sheetName.toUpperCase();
  const headerStr = headers.join(' ').toUpperCase();

  if (name.includes('EX') || name.includes('EXPENDITURE') || headerStr.includes('EXPENDITURE')) {
    return 'expenditure';
  }
  if (name.includes('IN PUT') || name.includes('INPUT') || headerStr.includes('CASH AMOUNT')) {
    return 'cash_input';
  }
  if (name.includes('SALARY') || name.includes('SALAR')) {
    return 'salary';
  }
  if (name.includes('PAY MENT') || name.includes('PAYMENT')) {
    return 'payment';
  }
  // Material sheets: cement, sand, gravel, steel, bricks, RMC, stone, robo
  if (name.includes('CEMENT') || name.includes('SAND') || name.includes('GRAVEL') ||
      name.includes('STEEL') || name.includes('BRICK') || name.includes('RMC') ||
      name.includes('STONE') || name.includes('ROBO') || name.includes('INFRA') ||
      name.includes('READY MIX') || name.includes('VEDA') ||
      headerStr.includes('NET WIGHT') || headerStr.includes('QUANTIY') || headerStr.includes('CUBICK')) {
    return 'material';
  }
  return 'unknown';
}

// ============================================================
// DATE PARSING
// ============================================================

function parseExcelDate(value: unknown): string | null {
  if (typeof value === 'number' && value > 40000 && value < 55000) {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  if (typeof value === 'string') {
    // Try common text date formats
    const match = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      let year = parseInt(match[3]);
      if (year < 100) year += 2000;
      if (day > 0 && day <= 31 && month > 0 && month <= 12) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  return null;
}

// ============================================================
// DESCRIPTION CLASSIFICATION
// ============================================================

const CATEGORY_KEYWORDS: { pattern: RegExp; category: string; categoryId: string }[] = [
  // Income patterns
  { pattern: /VARUN\s*SIR\s*CASH/i, category: 'Income', categoryId: '' },
  { pattern: /K\.?RAJESH\s*SIR\s*CASH/i, category: 'Income', categoryId: '' },
  { pattern: /CASH\s*(RECEIVED|INPUT)/i, category: 'Income', categoryId: '' },

  // Carry forward / balance
  { pattern: /CARRY\s*FORWARD/i, category: '_carry_forward', categoryId: '' },

  // Labour
  { pattern: /PAIRS?\s*\*?\d/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },
  { pattern: /MASON/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },
  { pattern: /DRILING|DRILLING/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },
  { pattern: /CARPENTER/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },
  { pattern: /RETAINING?\s*WALL/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },
  { pattern: /FLINTH\s*BEEM/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },
  { pattern: /SOIL\s*WORK/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },
  { pattern: /GUNEES\s*WORK/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },
  { pattern: /BLOSTING/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },
  { pattern: /SUPER\s*VISER|SUPERVISOR/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },
  { pattern: /WATCH\s*MAN/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },
  { pattern: /POP\s*/i, category: 'Labour', categoryId: '10000000-0000-0000-0000-000000000001' },

  // Food & Groceries
  { pattern: /KIRANAM|KIRANA/i, category: 'Food & Groceries', categoryId: '10000000-0000-0000-0000-000000000003' },
  { pattern: /VEG\b|VEGETABLE/i, category: 'Food & Groceries', categoryId: '10000000-0000-0000-0000-000000000003' },
  { pattern: /MILK|MILLK/i, category: 'Food & Groceries', categoryId: '10000000-0000-0000-0000-000000000003' },
  { pattern: /FOOD/i, category: 'Food & Groceries', categoryId: '10000000-0000-0000-0000-000000000003' },
  { pattern: /WATER\s*BOTTL/i, category: 'Food & Groceries', categoryId: '10000000-0000-0000-0000-000000000003' },
  { pattern: /D\s*MART/i, category: 'Food & Groceries', categoryId: '10000000-0000-0000-0000-000000000003' },
  { pattern: /SUPER\s*MARKET/i, category: 'Food & Groceries', categoryId: '10000000-0000-0000-0000-000000000003' },
  { pattern: /OIL\s*\(?\s*GO/i, category: 'Food & Groceries', categoryId: '10000000-0000-0000-0000-000000000003' },
  { pattern: /EGGS?\b/i, category: 'Food & Groceries', categoryId: '10000000-0000-0000-0000-000000000003' },
  { pattern: /TEA|SNACK/i, category: 'Food & Groceries', categoryId: '10000000-0000-0000-0000-000000000003' },

  // Electrical
  { pattern: /ELECTRIC/i, category: 'Electrical', categoryId: '10000000-0000-0000-0000-000000000004' },
  { pattern: /RAGHAVENDRA\s*ELECTRICAL/i, category: 'Electrical', categoryId: '10000000-0000-0000-0000-000000000004' },

  // Transport / Equipment
  { pattern: /JCB/i, category: 'Equipment', categoryId: '10000000-0000-0000-0000-000000000008' },
  { pattern: /DOZER/i, category: 'Equipment', categoryId: '10000000-0000-0000-0000-000000000008' },
  { pattern: /TRACTOR/i, category: 'Equipment', categoryId: '10000000-0000-0000-0000-000000000008' },
  { pattern: /AUTO\b/i, category: 'Transport', categoryId: '10000000-0000-0000-0000-000000000005' },

  // Fuel
  { pattern: /DIESEL/i, category: 'Fuel & Diesel', categoryId: '10000000-0000-0000-0000-000000000006' },
  { pattern: /FILING\s*STATION|FILLING\s*STATION/i, category: 'Fuel & Diesel', categoryId: '10000000-0000-0000-0000-000000000006' },
  { pattern: /PETROL/i, category: 'Fuel & Diesel', categoryId: '10000000-0000-0000-0000-000000000006' },

  // Salary
  { pattern: /SALARY/i, category: 'Salaries', categoryId: '10000000-0000-0000-0000-000000000007' },
  { pattern: /BATHA/i, category: 'Salaries', categoryId: '10000000-0000-0000-0000-000000000007' },

  // Materials
  { pattern: /CEMENT/i, category: 'Materials', categoryId: '10000000-0000-0000-0000-000000000002' },
  { pattern: /BINDING\s*WIRE/i, category: 'Materials', categoryId: '10000000-0000-0000-0000-000000000002' },
  { pattern: /COVERING\s*BOX|CAVARING\s*BOX/i, category: 'Materials', categoryId: '10000000-0000-0000-0000-000000000002' },
  { pattern: /SANITARY/i, category: 'Materials', categoryId: '10000000-0000-0000-0000-000000000002' },
  { pattern: /PLOSTICK|PLASTIC/i, category: 'Materials', categoryId: '10000000-0000-0000-0000-000000000002' },
  { pattern: /GLASS\s*DOOR/i, category: 'Materials', categoryId: '10000000-0000-0000-0000-000000000002' },
  { pattern: /PIPE\s*LINE/i, category: 'Plumbing', categoryId: '10000000-0000-0000-0000-000000000009' },

  // Site expenses
  { pattern: /JIO|SIM/i, category: 'Site Expenses', categoryId: '10000000-0000-0000-0000-000000000010' },
  { pattern: /REGISTER|REGESTER/i, category: 'Site Expenses', categoryId: '10000000-0000-0000-0000-000000000010' },
  { pattern: /TOKEN/i, category: 'Site Expenses', categoryId: '10000000-0000-0000-0000-000000000010' },
  { pattern: /PEN|STATIONERY/i, category: 'Site Expenses', categoryId: '10000000-0000-0000-0000-000000000010' },
  { pattern: /NEWS\s*PAPER/i, category: 'Site Expenses', categoryId: '10000000-0000-0000-0000-000000000010' },
];

function extractPartyFromDescription(desc: string): string | null {
  // Common patterns: "NAME description" or "NAME quantity description"
  // Try to extract the first capitalized name-like segment
  const cleaned = desc.trim();

  // Known person patterns from the workbook
  const personPatterns = [
    /^(B\.?BALAKRISHNA)/i,
    /^(P\.?JITENDER)/i,
    /^(S\.?KALYAN)/i,
    /^(SANDEEP\s+KIRANAM)/i,
    /^(SANDEEP\s+SUPER\s+MARKET)/i,
    /^(SK\s+KIRANAM)/i,
    /^(SAMBHAIAH)/i,
    /^(SRI\s+RAGHAVENDRA\s+ELECTRICAL)/i,
    /^(THIRUMALA\s+\w+)/i,
    /^(CHINTHALA\s+\w+)/i,
    /^(MALAHAL\s+RAO)/i,
    /^(A\.?UMESH)/i,
    /^(BABUL)/i,
    /^(K\.?SHARATH)/i,
    /^(R\.?MOGLI)/i,
    /^(VARUN\s+SIR)/i,
    /^(K\.?RAJESH\s+SIR)/i,
    /^(RANJITH\s+KIRANAM)/i,
    /^(ORAJABABU)/i,
    /^(ANADACHRY)/i,
    /^(ROHITH\s+\w+)/i,
    /^(J\.?GANESH)/i,
    /^(N\.?SATYANARAYANA)/i,
    /^(P\.?BALAKRISHAN)/i,
    /^(G\.?SUBBARAO)/i,
    /^(S\.?K\.?\s*ABBAS)/i,
    /^(SUDHAKER)/i,
    /^(CH\.?SUNIL)/i,
    /^(P\.?KIRAN)/i,
    /^(DOZER\s+S\.?PRASAD)/i,
    /^(GANEH?SH?\s+JCB)/i,
    /^(SRI\s*MATHA)/i,
    /^(EKASHILA)/i,
    /^(SAIBABA)/i,
    /^(S\s*MART)/i,
    /^(GM\s+STONE)/i,
    /^(SUBBARAO)/i,
  ];

  for (const pattern of personPatterns) {
    const match = cleaned.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function classifyDescription(desc: string): { category: string; categoryId: string; type: string } {
  for (const kw of CATEGORY_KEYWORDS) {
    if (kw.pattern.test(desc)) {
      if (kw.category === 'Income') {
        return { category: 'Income', categoryId: '', type: 'income' };
      }
      if (kw.category === '_carry_forward') {
        return { category: '_carry_forward', categoryId: '', type: 'opening_balance' };
      }
      return { category: kw.category, categoryId: kw.categoryId, type: 'expense' };
    }
  }
  return { category: 'Other', categoryId: '10000000-0000-0000-0000-000000000012', type: 'expense' };
}

// ============================================================
// EXPENDITURE SHEET PARSER
// ============================================================

function parseExpenditureSheet(sheetName: string, data: unknown[][]): ParsedRow[] {
  const rows: ParsedRow[] = [];
  let currentDate: string | null = null;
  let pendingDescription = '';
  let pendingRow: ParsedRow | null = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.every(c => c === '' || c === null || c === undefined)) continue;

    const col0 = row[0];
    const col1 = row[1];
    const col2 = row[2];
    const col3 = row[3];

    // Try to detect date row (Excel serial in col0 or standalone date)
    const dateFromCol0 = parseExcelDate(col0);
    if (dateFromCol0 && (!col1 || col1 === '')) {
      currentDate = dateFromCol0;
      continue;
    }

    // Detect header rows
    const headerStr = String(col0 || '') + String(col1 || '');
    if (headerStr.toUpperCase().includes('SNO') || headerStr.toUpperCase().includes('EXPENDITURE')) {
      continue;
    }

    // Detect total/summary rows
    if (typeof col0 === 'string' && col0.toUpperCase().includes('TOTAL')) continue;

    const desc = String(col1 || '').trim();
    const credit = typeof col2 === 'number' ? col2 : null;
    const debit = typeof col3 === 'number' ? col3 : null;

    // Skip empty description rows with no amounts
    if (!desc && !credit && !debit) continue;

    // If there's a serial number in col0 (a number), this is a primary row
    const hasSNO = typeof col0 === 'number' && col0 > 0 && col0 < 1000;

    // If no SNO but has description, it's a continuation line
    if (!hasSNO && desc && !credit && !debit) {
      if (pendingRow) {
        pendingRow.parsedData.description = (pendingRow.parsedData.description || '') + ' ' + desc;
      }
      continue;
    }

    // Flush pending row
    if (pendingRow) {
      finalizeParsedRow(pendingRow);
      rows.push(pendingRow);
    }

    if (!desc && !hasSNO) {
      pendingRow = null;
      continue;
    }

    // Determine amount and type
    const amount = debit || credit || null;
    if (!amount) {
      pendingRow = null;
      continue;
    }

    const classification = classifyDescription(desc);

    // Skip carry-forward rows
    if (classification.category === '_carry_forward') {
      pendingRow = null;
      continue;
    }

    // If it's a credit with income classification, it's money in
    // If it's a credit without income pattern, check if it's a carry-forward or income
    let txnType = classification.type;
    if (credit && !debit) {
      txnType = 'income';
    } else if (debit && !credit) {
      txnType = classification.type === 'income' ? 'income' : 'expense';
    }

    const party = extractPartyFromDescription(desc);

    pendingRow = {
      sheetName,
      rowNumber: i + 1,
      rawData: { col0, col1: desc, col2: credit, col3: debit },
      parsedData: {
        date: currentDate || undefined,
        amount,
        description: desc,
        category: classification.category,
        categoryId: classification.categoryId || undefined,
        party: party || undefined,
        type: txnType,
        paymentMethod: 'cash',
      },
      status: 'auto',
      confidence: 0,
      reason: '',
    };
  }

  // Flush last pending row
  if (pendingRow) {
    finalizeParsedRow(pendingRow);
    rows.push(pendingRow);
  }

  return rows;
}

function finalizeParsedRow(row: ParsedRow) {
  const d = row.parsedData;

  // Calculate confidence
  let confidence = 0.5;
  if (d.date) confidence += 0.15;
  if (d.amount && d.amount > 0) confidence += 0.15;
  if (d.category && d.category !== 'Other') confidence += 0.1;
  if (d.party) confidence += 0.1;

  row.confidence = Math.min(confidence, 1.0);
  row.status = confidence >= 0.8 ? 'auto' : confidence >= 0.5 ? 'review' : 'rejected';
  row.reason = buildReason(row);
}

function buildReason(row: ParsedRow): string {
  const parts: string[] = [];
  const d = row.parsedData;
  if (!d.date) parts.push('Missing date');
  if (!d.amount || d.amount <= 0) parts.push('Invalid amount');
  if (d.category === 'Other') parts.push('Could not classify category');
  if (!d.party) parts.push('Could not identify party');
  if (parts.length === 0) return 'Auto-classified';
  return parts.join('; ');
}

// ============================================================
// CASH INPUT SHEET PARSER
// ============================================================

function parseCashInputSheet(sheetName: string, data: unknown[][]): ParsedRow[] {
  const rows: ParsedRow[] = [];

  // The "IN PUT" sheet has multiple side-by-side columns for different cash sources
  // Pattern: SNO, DATE, CASH AMOUNT (repeated for each source)
  // Source names are in the rows above the headers

  let sources: { col: number; name: string }[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    // Detect source names (rows with names like "VARUN SIR CASH")
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').trim();
      if (val.includes('CASH') && !val.includes('SNO') && !val.includes('AMOUNT') && val.length > 5) {
        // Find if there's a header row nearby
        sources.push({ col: c, name: val.replace(/\s*CASH\s*/i, '').trim() });
      }
    }

    // Detect data rows (numeric SNO + date + amount)
    for (const source of sources) {
      const snoCol = source.col;
      // Look for SNO column (might be source.col or source.col - 1)
      const lookCols = [snoCol, snoCol - 1, snoCol - 2].filter(c => c >= 0);

      for (const startCol of lookCols) {
        const sno = row[startCol];
        const dateVal = row[startCol + 1];
        const amountVal = row[startCol + 2];

        if (typeof sno === 'number' && sno > 0 && sno < 500) {
          const date = parseExcelDate(dateVal);
          const amount = typeof amountVal === 'number' && amountVal >= 100 ? amountVal : null;

          if (date && amount) {
            rows.push({
              sheetName,
              rowNumber: i + 1,
              rawData: { sno, date: dateVal, amount: amountVal, source: source.name },
              parsedData: {
                date,
                amount,
                description: `Cash from ${source.name}`,
                category: 'Income',
                party: source.name,
                type: 'income',
                paymentMethod: 'cash',
              },
              status: 'auto',
              confidence: 0.9,
              reason: 'Cash input record',
            });
            break; // Don't double-count
          }
        }
      }
    }
  }

  // Deduplicate by rowNumber
  const seen = new Set<string>();
  return rows.filter(r => {
    const key = `${r.rowNumber}-${r.parsedData.amount}-${r.parsedData.party}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================
// SALARY SHEET PARSER
// ============================================================

function parseSalarySheet(sheetName: string, data: unknown[][]): ParsedRow[] {
  const rows: ParsedRow[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    // Look for rows with: SNO, NAME, DESIGNATION, PAID SALARY, BANK, CASH
    const sno = row[0] || row[7]; // Two sections side by side
    const name = row[1] || row[8];
    const designation = row[2] || row[9];
    const salary = row[3] || row[10];

    if (typeof sno === 'number' && sno > 0 && sno < 100 && typeof name === 'string' && name.length > 2) {
      const amount = typeof salary === 'number' ? salary : null;
      if (!amount || amount <= 0) continue;

      const bankCol = row[4] || row[11];
      const paymentMethod = String(bankCol || '').toUpperCase().includes('IDBI') ||
        String(bankCol || '').toUpperCase().includes('NEFT') ? 'bank_transfer' : 'cash';

      rows.push({
        sheetName,
        rowNumber: i + 1,
        rawData: { sno, name, designation, salary, bank: bankCol },
        parsedData: {
          amount,
          description: `Salary - ${String(designation || '')}`,
          category: 'Salaries',
          categoryId: '10000000-0000-0000-0000-000000000007',
          party: String(name).trim(),
          type: 'salary',
          paymentMethod,
        },
        status: 'auto',
        confidence: 0.85,
        reason: 'Salary record',
      });
    }
  }

  return rows;
}

// ============================================================
// PAYMENT SHEET PARSER
// ============================================================

function parsePaymentSheet(sheetName: string, data: unknown[][]): ParsedRow[] {
  const rows: ParsedRow[] = [];
  let currentPerson = '';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    // Detect person name rows (text in col0 without numbers)
    const col0Str = String(row[0] || '').trim();
    if (col0Str.length > 3 && !col0Str.match(/^(SNO|TOTAL)/i) && typeof row[0] === 'string') {
      // Check if this looks like a name (has letters, maybe has "PG NO")
      const nameMatch = col0Str.match(/^([A-Z][A-Z.\s]+)/);
      if (nameMatch) {
        currentPerson = nameMatch[1].trim();
        continue;
      }
    }

    // Data rows: SNO, DATE, BYCASH, BANK
    const sno = row[0];
    const dateVal = row[1];
    const cashAmount = typeof row[2] === 'number' ? row[2] : null;
    const bankAmount = typeof row[3] === 'number' ? row[3] : null;

    if (typeof sno === 'number' && sno > 0 && sno < 500) {
      const date = parseExcelDate(dateVal);
      const amount = cashAmount || bankAmount;
      if (!date || !amount) continue;

      rows.push({
        sheetName,
        rowNumber: i + 1,
        rawData: { sno, date: dateVal, cash: cashAmount, bank: bankAmount, person: currentPerson },
        parsedData: {
          date,
          amount,
          description: `Payment to ${currentPerson}`,
          party: currentPerson || undefined,
          type: 'supplier_payment',
          paymentMethod: bankAmount ? 'bank_transfer' : 'cash',
        },
        status: currentPerson ? 'auto' : 'review',
        confidence: currentPerson ? 0.85 : 0.6,
        reason: currentPerson ? 'Payment record' : 'Payment - person unclear',
      });
    }
  }

  return rows;
}

// ============================================================
// MATERIAL SHEET PARSER
// ============================================================

function parseMaterialSheet(sheetName: string, data: unknown[][]): ParsedRow[] {
  const rows: ParsedRow[] = [];
  let supplier = '';
  let materialType = '';

  // Detect supplier and material from early rows
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    for (const cell of row) {
      const val = String(cell || '').trim().toUpperCase();
      if (val.length > 3 && !val.match(/^(SNO|DATE|NO|SIZE|NET)/)) {
        if (!supplier && val.match(/[A-Z]{3,}/)) {
          // First significant text is likely supplier or material
          if (val.includes('SAND') || val.includes('CEMENT') || val.includes('GRAVEL') ||
            val.includes('STEEL') || val.includes('BRICK') || val.includes('RMC') ||
            val.includes('M-SAND') || val.includes('20MM') || val.includes('40MM') ||
            val.includes('C-SAND')) {
            materialType = val;
          } else {
            supplier = val;
          }
        }
      }
    }
  }

  // Parse data rows
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    // Look for: SNO/NO, DATE, quantity/weight, ...
    for (let c = 0; c < row.length - 2; c++) {
      const sno = row[c];
      const dateVal = row[c + 1];
      const quantityVal = row[c + 2];

      if (typeof sno === 'number' && sno > 0 && sno < 500) {
        const date = parseExcelDate(dateVal);
        if (!date) continue;

        // Try to extract quantity
        let quantity: number | undefined;
        let unit = 'units';

        if (typeof quantityVal === 'number') {
          quantity = quantityVal;
        } else if (typeof quantityVal === 'string') {
          const numMatch = quantityVal.match(/(\d+[\d,]*)/);
          if (numMatch) quantity = parseInt(numMatch[1].replace(/,/g, ''));
          if (quantityVal.toUpperCase().includes('KG')) unit = 'kg';
          if (quantityVal.toUpperCase().includes('BAG')) unit = 'bags';
          if (quantityVal.toUpperCase().includes('M 3') || quantityVal.toUpperCase().includes('CUBICK')) unit = 'cubic m';
        }

        rows.push({
          sheetName,
          rowNumber: i + 1,
          rawData: { sno, date: dateVal, quantity: quantityVal, supplier, material: materialType },
          parsedData: {
            date,
            description: `${materialType || sheetName} delivery${supplier ? ' from ' + supplier : ''}`,
            category: 'Materials',
            categoryId: '10000000-0000-0000-0000-000000000002',
            party: supplier || undefined,
            type: 'supplier_purchase',
            quantity,
            unit,
          },
          status: 'review', // Material records often lack amounts, mark for review
          confidence: 0.6,
          reason: 'Material delivery record (no amount in source)',
        });

        break; // Move to next row
      }
    }
  }

  return rows;
}

// ============================================================
// MAIN PARSE FUNCTION
// ============================================================

export function parseWorkbook(buffer: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buffer, { type: 'array' });
  const allRows: ParsedRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws || !ws['!ref']) continue;

    const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
    if (data.length < 3) continue;

    // Flatten first few rows for header detection
    const headerCells: string[] = [];
    for (let i = 0; i < Math.min(8, data.length); i++) {
      for (const cell of (data[i] as unknown[]) || []) {
        headerCells.push(String(cell || '').toUpperCase());
      }
    }

    const sheetType = detectSheetType(sheetName, headerCells);

    let parsed: ParsedRow[] = [];
    switch (sheetType) {
      case 'expenditure':
        parsed = parseExpenditureSheet(sheetName, data as unknown[][]);
        break;
      case 'cash_input':
        parsed = parseCashInputSheet(sheetName, data as unknown[][]);
        break;
      case 'salary':
        parsed = parseSalarySheet(sheetName, data as unknown[][]);
        break;
      case 'payment':
        parsed = parsePaymentSheet(sheetName, data as unknown[][]);
        break;
      case 'material':
        parsed = parseMaterialSheet(sheetName, data as unknown[][]);
        break;
      default:
        // Skip unknown sheets
        break;
    }

    allRows.push(...parsed);
  }

  // Deduplicate: flag potential duplicates across sheets
  for (let i = 0; i < allRows.length; i++) {
    for (let j = i + 1; j < allRows.length; j++) {
      const a = allRows[i].parsedData;
      const b = allRows[j].parsedData;
      if (
        a.date === b.date &&
        a.amount === b.amount &&
        a.amount !== undefined &&
        a.party === b.party &&
        a.party !== undefined
      ) {
        // Mark the later one as duplicate
        allRows[j].status = 'review';
        allRows[j].confidence = Math.min(allRows[j].confidence, 0.4);
        allRows[j].reason = `Possible duplicate of row ${allRows[i].rowNumber} in ${allRows[i].sheetName}`;
      }
    }
  }

  const auto = allRows.filter(r => r.status === 'auto').length;
  const review = allRows.filter(r => r.status === 'review').length;
  const rejected = allRows.filter(r => r.status === 'rejected').length;

  return {
    total: allRows.length,
    auto,
    review,
    rejected,
    rows: allRows,
  };
}
