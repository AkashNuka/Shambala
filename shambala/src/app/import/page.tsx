'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { parseWorkbook, type ParseResult, type ParsedRow } from '@/lib/excel-parser';
import { formatCurrency } from '@/lib/utils';

export default function ImportPage() {
  const router = useRouter();
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'auto' | 'review' | 'rejected'>('auto');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    setError('');
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseWorkbook(buffer);
      setResult(parsed);
      setRows(parsed.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const updateRowStatus = (index: number, status: ParsedRow['status']) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status };
      return updated;
    });
  };

  const filteredRows = rows.filter(r => r.status === tab);

  const handleImport = async () => {
    setImporting(true);
    try {
      // Import all auto + manually approved rows
      const toImport = rows.filter(r => r.status === 'auto');

      // Use the import API
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: toImport }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setImportDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (importDone) {
    const importedCount = rows.filter(r => r.status === 'auto').length;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-green-glow flex items-center justify-center text-4xl mb-4">
          ✓
        </div>
        <h2 className="text-xl font-bold text-green">Import Complete!</h2>
        <p className="text-text-secondary text-sm mt-2">{importedCount} transactions imported</p>
        <button
          onClick={() => { router.push('/expenses'); router.refresh(); }}
          className="mt-6 px-8 py-3 bg-accent text-white rounded-2xl font-semibold active:scale-95 transition-transform"
        >
          View Expenses
        </button>
      </div>
    );
  }

  // ============================================================
  // UPLOAD SCREEN
  // ============================================================
  if (!result) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold mb-2">Import Excel</h1>
        <p className="text-text-secondary text-sm mb-6">
          Upload your EXPENDITURE 2025.xlsx file. The system will analyze and classify each transaction.
        </p>

        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-accent transition-colors"
        >
          {parsing ? (
            <div className="animate-pulse-subtle">
              <div className="text-4xl mb-3">⚙️</div>
              <p className="text-text-secondary text-sm">Analyzing workbook...</p>
              <p className="text-text-muted text-xs mt-1">Detecting sheets, dates, amounts, categories</p>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-3">📥</div>
              <p className="text-text-secondary text-sm mb-4">Drag & drop your Excel file here</p>
              <label className="inline-block px-6 py-3 bg-accent text-white rounded-xl font-semibold cursor-pointer active:scale-95 transition-transform">
                Choose File
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red/10 border border-red/30 rounded-xl px-4 py-3 text-sm text-red">
            {error}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // REVIEW SCREEN
  // ============================================================
  const autoCount = rows.filter(r => r.status === 'auto').length;
  const reviewCount = rows.filter(r => r.status === 'review').length;
  const rejectedCount = rows.filter(r => r.status === 'rejected').length;

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto pb-24">
      <h1 className="text-xl font-bold mb-2">Review Import</h1>
      <p className="text-text-secondary text-sm mb-6">
        Found {result.total} potential transactions
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-green-glow border border-green/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green">{autoCount}</p>
          <p className="text-[10px] text-text-muted uppercase">Ready</p>
        </div>
        <div className="bg-amber/10 border border-amber/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber">{reviewCount}</p>
          <p className="text-[10px] text-text-muted uppercase">Review</p>
        </div>
        <div className="bg-red/10 border border-red/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red">{rejectedCount}</p>
          <p className="text-[10px] text-text-muted uppercase">Rejected</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'auto' as const, label: 'Ready', count: autoCount },
          { key: 'review' as const, label: 'Review', count: reviewCount },
          { key: 'rejected' as const, label: 'Rejected', count: rejectedCount },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              tab === t.key
                ? 'bg-accent text-white'
                : 'bg-bg-card border border-border text-text-secondary'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Row list */}
      <div className="space-y-2 mb-6">
        {filteredRows.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">No rows in this category</p>
          </div>
        ) : (
          filteredRows.map((row, idx) => {
            const globalIdx = rows.indexOf(row);
            return (
              <div key={`${row.sheetName}-${row.rowNumber}`} className="bg-bg-card border border-border rounded-2xl p-4 animate-fade-in">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {row.parsedData.description || '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {row.parsedData.date && (
                        <span className="text-[10px] text-text-muted bg-bg-elevated px-2 py-0.5 rounded">
                          {row.parsedData.date}
                        </span>
                      )}
                      {row.parsedData.category && (
                        <span className="text-[10px] text-accent bg-accent-glow px-2 py-0.5 rounded">
                          {row.parsedData.category}
                        </span>
                      )}
                      {row.parsedData.party && (
                        <span className="text-[10px] text-text-secondary bg-bg-elevated px-2 py-0.5 rounded">
                          {row.parsedData.party}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap">
                    {row.parsedData.amount ? formatCurrency(row.parsedData.amount) : '—'}
                  </span>
                </div>

                {/* Reason */}
                <p className="text-[10px] text-text-muted mb-2">{row.reason}</p>

                {/* Source info */}
                <p className="text-[10px] text-text-muted mb-2">
                  Sheet: {row.sheetName} · Row {row.rowNumber} · Confidence: {Math.round(row.confidence * 100)}%
                </p>

                {/* Actions for review items */}
                {tab === 'review' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => updateRowStatus(globalIdx, 'auto')}
                      className="flex-1 py-1.5 text-xs font-semibold bg-green/10 text-green border border-green/20 rounded-lg active:scale-95 transition-transform"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => updateRowStatus(globalIdx, 'rejected')}
                      className="flex-1 py-1.5 text-xs font-semibold bg-red/10 text-red border border-red/20 rounded-lg active:scale-95 transition-transform"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {tab === 'rejected' && (
                  <button
                    onClick={() => updateRowStatus(globalIdx, 'auto')}
                    className="w-full py-1.5 text-xs font-semibold bg-green/10 text-green border border-green/20 rounded-lg active:scale-95 transition-transform mt-2"
                  >
                    ✓ Approve Anyway
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red/10 border border-red/30 rounded-xl px-4 py-3 text-sm text-red">
          {error}
        </div>
      )}

      {/* Import button — fixed at bottom */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleImport}
            disabled={importing || autoCount === 0}
            className={`w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-[0.98] ${
              importing || autoCount === 0
                ? 'bg-bg-elevated text-text-muted cursor-not-allowed'
                : 'bg-green text-white shadow-glow-green hover:brightness-110'
            }`}
          >
            {importing ? (
              <span className="animate-pulse-subtle">Importing {autoCount} transactions...</span>
            ) : (
              `Import ${autoCount} Transactions`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
