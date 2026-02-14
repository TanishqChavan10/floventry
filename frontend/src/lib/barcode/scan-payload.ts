export type ParsedScanPayload = {
  raw: string;
  barcode: string;
  expiryDate?: string; // YYYY-MM-DD (HTML date input compatible)
  batchNo?: string;
  quantity?: number;
};

function stripControlChars(value: string): string {
  return value.replace(/[\x00-\x1F\x7F]/g, '');
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function toYmd(date: Date): string | null {
  if (!Number.isFinite(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseExpiryToYmd(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = normalizeWhitespace(value);
  if (!v) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // YYYYMMDD
  if (/^\d{8}$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const m = Number(v.slice(4, 6));
    const d = Number(v.slice(6, 8));
    const dt = new Date(y, m - 1, d);
    return toYmd(dt);
  }

  // YYMMDD (common in some QR payloads)
  if (/^\d{6}$/.test(v)) {
    const yy = Number(v.slice(0, 2));
    const y = 2000 + yy;
    const m = Number(v.slice(2, 4));
    const d = Number(v.slice(4, 6));
    const dt = new Date(y, m - 1, d);
    return toYmd(dt);
  }

  // DD/MM/YYYY
  const m1 = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m1) {
    const d = Number(m1[1]);
    const m = Number(m1[2]);
    const y = Number(m1[3]);
    const dt = new Date(y, m - 1, d);
    return toYmd(dt);
  }

  // Fallback: Date.parse (ISO-ish)
  const parsed = new Date(v);
  return toYmd(parsed);
}

function parseQuantity(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const n = Number(value.trim());
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const s = normalizeWhitespace(value);
  return s ? s : undefined;
}

function parseFromJson(raw: string): ParsedScanPayload | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  try {
    const parsed = JSON.parse(trimmed) as any;
    const obj = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!obj || typeof obj !== 'object') return null;

    const barcode =
      asString(obj.barcode) ??
      asString(obj.ean) ??
      asString(obj.ean13) ??
      asString(obj.gtin) ??
      asString(obj.gtin13);
    if (!barcode) return null;

    const expiryDate =
      parseExpiryToYmd(obj.expiry) ??
      parseExpiryToYmd(obj.expiryDate) ??
      parseExpiryToYmd(obj.exp) ??
      parseExpiryToYmd(obj.bestBefore);

    const batchNo = asString(obj.batch) ?? asString(obj.batchNo) ?? asString(obj.lot);
    const quantity = parseQuantity(obj.qty) ?? parseQuantity(obj.quantity);

    return {
      raw,
      barcode,
      ...(expiryDate ? { expiryDate } : {}),
      ...(batchNo ? { batchNo } : {}),
      ...(typeof quantity === 'number' ? { quantity } : {}),
    };
  } catch {
    return null;
  }
}

function parseFromPipe(raw: string): ParsedScanPayload | null {
  if (!raw.includes('|')) return null;
  const parts = raw
    .split('|')
    .map((p) => normalizeWhitespace(p))
    .filter(Boolean);

  if (!parts.length) return null;
  const barcode = parts[0];
  if (!barcode) return null;

  let expiryDate: string | null = null;
  let batchNo: string | undefined;
  let quantity: number | undefined;

  for (const part of parts.slice(1)) {
    const [kRaw, ...rest] = part.split(':');
    const k = kRaw?.trim().toLowerCase();
    const v = rest.join(':').trim();

    if (rest.length === 0) {
      // No key, try infer as date.
      const inferred = parseExpiryToYmd(part);
      if (inferred) expiryDate = inferred;
      continue;
    }

    if (k === 'exp' || k === 'expiry' || k === 'expirydate' || k === 'bestbefore') {
      const parsed = parseExpiryToYmd(v);
      if (parsed) expiryDate = parsed;
      continue;
    }

    if (k === 'batch' || k === 'batchno' || k === 'lot') {
      batchNo = v || undefined;
      continue;
    }

    if (k === 'qty' || k === 'quantity') {
      const q = parseQuantity(v);
      if (typeof q === 'number') quantity = q;
      continue;
    }
  }

  return {
    raw,
    barcode,
    ...(expiryDate ? { expiryDate } : {}),
    ...(batchNo ? { batchNo } : {}),
    ...(typeof quantity === 'number' ? { quantity } : {}),
  };
}

export function parseScanPayload(raw: string): ParsedScanPayload {
  const cleaned = normalizeWhitespace(stripControlChars(raw));

  // Prefer JSON for QR payloads.
  const fromJson = parseFromJson(cleaned);
  if (fromJson) return fromJson;

  const fromPipe = parseFromPipe(cleaned);
  if (fromPipe) return fromPipe;

  return { raw: cleaned, barcode: cleaned };
}
