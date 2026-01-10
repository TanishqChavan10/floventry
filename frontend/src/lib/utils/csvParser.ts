/**
 * Generic CSV parsing for import preview
 */

export interface ParsedRow {
    data: Record<string, string>;
    lineNumber: number;
    isEmpty: boolean;
}

export interface CsvParseResult {
    rows: ParsedRow[];
    headers: string[];
    hasErrors: boolean;
}

/**
 * Parses CSV content into structured rows for preview
 */
export function parseCsvForPreview(csvContent: string): CsvParseResult {
    const lines = csvContent.split(/\r?\n/);
    if (lines.length === 0) {
        return { rows: [], headers: [], hasErrors: false };
    }

    // Parse first line as headers
    const headerLine = lines[0].trim();
    const headers = parseCsvLine(headerLine);

    const rows: ParsedRow[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) continue;

        const values = parseCsvLine(line);
        const data: Record<string, string> = {};

        headers.forEach((header, index) => {
            data[header] = values[index] || '';
        });

        const isEmpty = !values.some(v => v.trim() !== '');

        rows.push({
            data,
            lineNumber: i + 1,
            isEmpty,
        });
    }

    return {
        rows,
        headers,
        hasErrors: rows.some(r => r.isEmpty),
    };
}

/**
 * Parses a single CSV line, handling quoted fields
 */
function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    // Push last field
    result.push(current);

    return result.map(field => field.trim());
}

/**
 * Converts TSV to CSV
 */
export function tsvToCsv(tsvContent: string): string {
    return tsvContent.replace(/\t/g, ',');
}
