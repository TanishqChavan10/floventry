/**
 * Parse plain text input into CSV format
 * Categories: "Category Name - Description" or just "Category Name"
 * Products: "SKU | Name | Unit | Description"
 */

export interface ParsedCategory {
    name: string;
    description: string | null;
    lineNumber: number;
    isEmpty: boolean;
}

export interface ParsedProduct {
    sku: string;
    name: string;
    unit: string;
    barcode: string | null;
    category: string | null;
    supplier: string | null;
    costPrice: string | null;
    sellingPrice: string | null;
    description: string | null;
    lineNumber: number;
    isEmpty: boolean;
}

export interface ParsedSupplier {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    lineNumber: number;
    isEmpty: boolean;
}

export interface PlainTextParseResult {
    categories: (ParsedCategory | ParsedProduct | ParsedSupplier)[];
    csvContent: string;
    hasErrors: boolean;
}

/**
 * Parses plain text input into structured category data
 * @param text - Plain text input with one category per line
 * @returns Parsed categories and CSV content
 */
export function parsePlainTextCategories(text: string): PlainTextParseResult {
    const lines = text.split(/\r?\n/);
    const categories: ParsedCategory[] = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Skip empty lines
        if (trimmed === '') {
            return;
        }

        let name = '';
        let description: string | null = null;

        // Check if line contains a separator
        if (trimmed.includes(' - ')) {
            const parts = trimmed.split(' - ');
            name = parts[0].trim();
            description = parts.slice(1).join(' - ').trim() || null;
        } else {
            name = trimmed;
        }

        categories.push({
            name,
            description,
            lineNumber: index + 1,
            isEmpty: name === '',
        });
    });

    // Convert to CSV format for backend
    const csvContent = convertCategoriesToCSV(categories);

    return {
        categories,
        csvContent,
        hasErrors: categories.some(c => c.isEmpty),
    };
}

/**
 * Parses plain text input into structured product data
 * Pipe format: "SKU | Name | Unit | Description" or "SKU | Name | Unit | Barcode | Category | Supplier | Cost | Selling | Description"
 * Dash format: "Name - SKU - Category - Supplier - Unit - Cost - Selling - Description"
 * @param text - Plain text input with one product per line
 * @returns Parsed products and CSV content
 */
export function parsePlainTextProducts(text: string): PlainTextParseResult {
    const lines = text.split(/\r?\n/);
    const products: ParsedProduct[] = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Skip empty lines
        if (trimmed === '') {
            return;
        }

        let sku = '';
        let name = '';
        let unit = '';
        let barcode: string | null = null;
        let category: string | null = null;
        let supplier: string | null = null;
        let costPrice: string | null = null;
        let sellingPrice: string | null = null;
        let description: string | null = null;

        // Check if line contains pipe separator (SKU first format)
        if (trimmed.includes('|')) {
            const parts = trimmed.split('|').map(p => p.trim());

            if (parts.length >= 3) {
                sku = parts[0];
                name = parts[1];
                unit = parts[2];

                // Simple format: SKU | Name | Unit | Description (4 fields)
                if (parts.length === 4) {
                    description = parts[3] || null;
                }
                // Extended format: SKU | Name | Unit | Barcode | Category | Supplier | Cost | Selling | Description (9 fields)
                else if (parts.length >= 5) {
                    barcode = parts[3] || null;
                    if (parts.length >= 5) category = parts[4] || null;
                    if (parts.length >= 6) supplier = parts[5] || null;
                    if (parts.length >= 7) costPrice = parts[6] || null;
                    if (parts.length >= 8) sellingPrice = parts[7] || null;
                    if (parts.length >= 9) description = parts[8] || null;
                }
            }
        }
        // Check if line contains dash separator (Name first format)
        else if (trimmed.includes(' - ')) {
            const parts = trimmed.split(' - ').map(p => p.trim());

            // Dash format: Name - SKU - Category - Supplier - Unit - Cost - Selling - Description (8 fields)
            if (parts.length >= 5) {
                name = parts[0];
                sku = parts[1];
                category = parts[2] || null;
                supplier = parts[3] || null;
                unit = parts[4];
                if (parts.length >= 6) costPrice = parts[5] || null;
                if (parts.length >= 7) sellingPrice = parts[6] || null;
                if (parts.length >= 8) description = parts[7] || null;
            }
        }

        products.push({
            sku,
            name,
            unit,
            barcode,
            category,
            supplier,
            costPrice,
            sellingPrice,
            description,
            lineNumber: index + 1,
            isEmpty: !sku || !name || !unit,
        } as any);
    });

    // Convert to CSV format for backend
    const csvContent = convertProductsToCSV(products);

    return {
        categories: products as any,
        csvContent,
        hasErrors: products.some(p => p.isEmpty),
    };
}

/**
 * Converts parsed categories to CSV format
 */
function convertCategoriesToCSV(categories: ParsedCategory[]): string {
    if (categories.length === 0) {
        return '';
    }

    // Create CSV header
    const header = 'name,description';

    // Create CSV rows
    const rows = categories
        .filter(c => !c.isEmpty)
        .map(c => {
            const name = escapeCsvField(c.name);
            const description = c.description ? escapeCsvField(c.description) : '';
            return `${name},${description}`;
        });

    return [header, ...rows].join('\n');
}

/**
 * Converts parsed products to CSV format
 */
function convertProductsToCSV(products: ParsedProduct[]): string {
    if (products.length === 0) {
        return '';
    }

    // Create CSV header matching backend template
    const header = 'sku,name,barcode,category,supplier,unit,cost_price,selling_price,image_url,description,min_stock_level,reorder_point,max_stock_level';

    // Create CSV rows
    const rows = products
        .filter(p => !p.isEmpty)
        .map(p => {
            const sku = escapeCsvField(p.sku);
            const name = escapeCsvField(p.name);
            const barcode = p.barcode ? escapeCsvField(p.barcode) : '';
            const category = p.category ? escapeCsvField(p.category) : '';
            const supplier = p.supplier ? escapeCsvField(p.supplier) : '';
            const unit = escapeCsvField(p.unit);
            const costPrice = p.costPrice || '';
            const sellingPrice = p.sellingPrice || '';
            const description = p.description ? escapeCsvField(p.description) : '';

            // Plain text parser doesn't capture image_url and stock levels, leave empty
            return `${sku},${name},${barcode},${category},${supplier},${unit},${costPrice},${sellingPrice},,${description},,,`;
        });

    return [header, ...rows].join('\n');
}

/**
 * Escapes a CSV field value
 */
function escapeCsvField(value: string): string {
    // If the value contains comma, newline, or quotes, wrap it in quotes
    if (/[,"\n\r]/.test(value)) {
        // Escape existing quotes by doubling them
        const escaped = value.replace(/"/g, '""');
        return `"${escaped}"`;
    }
    return value;
}

/**
 * Parses plain text input into structured supplier data
 * Format: "Name | Email | Phone | Address" or "Name - Email - Phone - Address"
 * @param text - Plain text input with one supplier per line
 * @returns Parsed suppliers and CSV content
 */
export function parsePlainTextSuppliers(text: string): PlainTextParseResult {
    const lines = text.split(/\r?\n/);
    const suppliers: ParsedSupplier[] = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Skip empty lines
        if (trimmed === '') {
            return;
        }

        let name = '';
        let email: string | null = null;
        let phone: string | null = null;
        let address: string | null = null;

        // Check if line contains pipe separator or dash separator
        if (trimmed.includes('|')) {
            const parts = trimmed.split('|').map(p => p.trim());

            if (parts.length >= 1) {
                name = parts[0];
                if (parts.length >= 2) email = parts[1] || null;
                if (parts.length >= 3) phone = parts[2] || null;
                if (parts.length >= 4) address = parts[3] || null;
            }
        } else if (trimmed.includes(' - ')) {
            // Support dash separator as well
            const parts = trimmed.split(' - ').map(p => p.trim());

            if (parts.length >= 1) {
                name = parts[0];
                if (parts.length >= 2) email = parts[1] || null;
                if (parts.length >= 3) phone = parts[2] || null;
                if (parts.length >= 4) address = parts[3] || null;
            }
        } else {
            name = trimmed;
        }

        suppliers.push({
            name,
            email,
            phone,
            address,
            lineNumber: index + 1,
            isEmpty: !name,
        });
    });

    // Convert to CSV format for backend
    const csvContent = convertSuppliersToCSV(suppliers);

    return {
        categories: suppliers as any,
        csvContent,
        hasErrors: suppliers.some(s => s.isEmpty),
    };
}

/**
 * Converts parsed suppliers to CSV format
 */
function convertSuppliersToCSV(suppliers: ParsedSupplier[]): string {
    if (suppliers.length === 0) {
        return '';
    }

    // Create CSV header matching backend template
    const header = 'name,contact_person,email,phone,address';

    // Create CSV rows
    const rows = suppliers
        .filter(s => !s.isEmpty)
        .map(s => {
            const name = escapeCsvField(s.name);
            const email = s.email ? escapeCsvField(s.email) : '';
            const phone = s.phone ? escapeCsvField(s.phone) : '';
            const address = s.address ? escapeCsvField(s.address) : '';

            // contact_person is not in plain text, leave empty
            return `${name},,${email},${phone},${address}`;
        });

    return [header, ...rows].join('\n');
}

/**
 * Detects if the input text is likely plain text format vs CSV/TSV
 */
export function detectInputFormat(text: string): 'plain' | 'csv' | 'tsv' {
    const trimmed = text.trim();
    if (!trimmed) return 'plain';

    const lines = trimmed.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return 'plain';

    const firstLine = lines[0];

    // Check for TSV (tabs)
    if (firstLine.includes('\t')) {
        return 'tsv';
    }

    // Check for CSV (comma with likely header)
    if (firstLine.includes(',') && (
        firstLine.toLowerCase().includes('name') ||
        firstLine.toLowerCase().includes('description')
    )) {
        return 'csv';
    }

    // Default to plain text
    return 'plain';
}

/**
 * Parsed unit interface
 */
export interface ParsedUnit {
    name: string;
    shortCode: string;
    isDefault: boolean;
    lineNumber: number;
    isEmpty: boolean;
}

/**
 * Parses plain text input into structured unit data
 * Format: "Name | Short Code" or "Name | Short Code | Default"
 * @param text - Plain text input with one unit per line
 * @returns Parsed units and CSV content
 */
export function parsePlainTextUnits(text: string): PlainTextParseResult {
    const lines = text.split(/\r?\n/);
    const units: ParsedUnit[] = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Skip empty lines
        if (trimmed === '') {
            return;
        }

        let name = '';
        let shortCode = '';
        let isDefault = false;

        // Check if line contains pipe separator or dash separator
        if (trimmed.includes('|')) {
            const parts = trimmed.split('|').map(p => p.trim());

            if (parts.length >= 2) {
                name = parts[0];
                shortCode = parts[1];
                if (parts.length >= 3) {
                    const defaultFlag = parts[2].toLowerCase();
                    isDefault = defaultFlag === 'true' || defaultFlag === 'yes' || defaultFlag === '1' || defaultFlag === 'default';
                }
            } else if (parts.length === 1) {
                name = parts[0];
            }
        } else if (trimmed.includes(' - ')) {
            // Support dash separator as well
            const parts = trimmed.split(' - ').map(p => p.trim());

            if (parts.length >= 2) {
                name = parts[0];
                shortCode = parts[1];
                if (parts.length >= 3) {
                    const defaultFlag = parts[2].toLowerCase();
                    isDefault = defaultFlag === 'true' || defaultFlag === 'yes' || defaultFlag === '1' || defaultFlag === 'default';
                }
            } else if (parts.length === 1) {
                name = parts[0];
            }
        } else {
            name = trimmed;
        }

        units.push({
            name,
            shortCode,
            isDefault,
            lineNumber: index + 1,
            isEmpty: !name || !shortCode,
        });
    });

    // Convert to CSV format for backend
    const csvContent = convertUnitsToCSV(units);

    return {
        categories: units as any,
        csvContent,
        hasErrors: units.some(u => u.isEmpty),
    };
}

/**
 * Converts parsed units to CSV format
 */
function convertUnitsToCSV(units: ParsedUnit[]): string {
    if (units.length === 0) {
        return '';
    }

    // Create CSV header matching backend template
    const header = 'name,shortCode,isDefault';

    // Create CSV rows
    const rows = units
        .filter(u => !u.isEmpty)
        .map(u => {
            const name = escapeCsvField(u.name);
            const shortCode = escapeCsvField(u.shortCode);
            const isDefault = u.isDefault ? 'true' : 'false';

            return `${name},${shortCode},${isDefault}`;
        });

    return [header, ...rows].join('\n');
}
