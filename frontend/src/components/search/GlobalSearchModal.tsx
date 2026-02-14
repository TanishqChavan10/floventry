'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconSearch } from '@tabler/icons-react';
import { useParams } from 'next/navigation';

import { useGlobalSearch } from './useGlobalSearch';
import { GlobalSearchResults, type FlattenedSearchItem } from './GlobalSearchResults';

function flattenResults(args: {
  products: Array<{ id: string; name: string; sku: string; barcode?: string | null }>;
  warehouses: Array<{ id: string; name: string; code?: string | null; status: string }>;
  documents: Array<{ id: string; type: 'GRN' | 'ISSUE' | 'TRANSFER'; number: string }>;
}): FlattenedSearchItem[] {
  const items: FlattenedSearchItem[] = [];

  for (const p of args.products) {
    items.push({
      key: `product:${p.id}`,
      kind: 'product',
      id: p.id,
      title: p.name,
      subtitle: [p.sku, p.barcode].filter(Boolean).join(' • '),
    });
  }

  for (const w of args.warehouses) {
    const archived = String(w.status).toLowerCase() !== 'active';
    items.push({
      key: `warehouse:${w.id}`,
      kind: 'warehouse',
      id: w.id,
      title: w.name,
      subtitle: w.code ? `Code: ${w.code}` : undefined,
      badge: archived ? 'Archived' : undefined,
    });
  }

  for (const d of args.documents) {
    const label = d.type === 'GRN' ? 'GRN' : d.type === 'ISSUE' ? 'Issue' : 'Transfer';
    items.push({
      key: `document:${d.type}:${d.id}`,
      kind: 'document',
      id: d.id,
      type: d.type,
      title: `${label} ${d.number}`,
      subtitle: 'Inventory document',
    });
  }

  return items;
}

export function GlobalSearchModal() {
  const params = useParams();
  const companySlug = params?.slug as string | undefined;

  const {
    open,
    closePalette,
    query,
    setQuery,
    loading,
    error,
    results,
    activeIndex,
    setActiveIndex,
    navigateToResult,
  } = useGlobalSearch();

  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const actionItems: FlattenedSearchItem[] = useMemo(() => {
    const actions: FlattenedSearchItem[] = [
      {
        key: 'action:create-company',
        kind: 'action',
        id: 'create-company',
        title: 'Create company',
        subtitle: 'Set up a new company workspace',
      },
    ];

    const q = (query ?? '').trim();
    const looksLikeBarcode = q.replace(/[\x00-\x1F\x7F]/g, '').replace(/\s+/g, '').length >= 4;

    if (companySlug) {
      if (looksLikeBarcode) {
        actions.unshift({
          key: 'action:scan-barcode',
          kind: 'action',
          id: 'scan-barcode',
          title: 'Scan barcode',
          subtitle: 'Open product by barcode (Premium)',
        });
      }

      actions.unshift({
        key: 'action:create-warehouse',
        kind: 'action',
        id: 'create-warehouse',
        title: 'Create warehouse',
        subtitle: 'Add a new warehouse to this company',
      });
    }

    return actions;
  }, [companySlug, query]);

  const items = useMemo(() => {
    const searched = flattenResults({
      products: results.products,
      warehouses: results.warehouses,
      documents: results.documents,
    });

    return [...actionItems, ...searched];
  }, [actionItems, results.documents, results.products, results.warehouses]);

  useEffect(() => {
    if (!open) return;
    // Focus after paint.
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!mounted || !open) return null;

  const canNavigate = items.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
      return;
    }

    if (e.key === 'Tab') {
      // Keep focus in the input for keyboard-first navigation.
      e.preventDefault();
      inputRef.current?.focus();
      return;
    }

    if (!canNavigate) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((activeIndex + 1) % items.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((activeIndex - 1 + items.length) % items.length);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[activeIndex];
      if (!item) return;
      navigateToResult(item);
    }
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePalette();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 pt-24"
      onMouseDown={handleOverlayMouseDown}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      <div
        ref={panelRef}
        className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <IconSearch className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, warehouses, GRNs, issues, transfers…"
            className="flex-1 h-10 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="text-xs text-muted-foreground hidden sm:block">Esc</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <GlobalSearchResults
              loading={false}
              results={{ products: [], warehouses: [], documents: [] }}
              items={items}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              onSelect={(selected) => navigateToResult(selected)}
            />
          ) : error ? (
            <div className="px-4 py-6 text-sm text-red-600">{error}</div>
          ) : (
            <GlobalSearchResults
              loading={loading}
              results={results}
              items={items}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              onSelect={(selected) => navigateToResult(selected)}
            />
          )}
        </div>

        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span>↑/↓ to navigate • Enter to open</span>
          <span>Ctrl/⌘+K</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
