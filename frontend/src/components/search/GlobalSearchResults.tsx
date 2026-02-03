'use client';

import React from 'react';
import type { GlobalSearchDocumentType, GlobalSearchResultsData } from './useGlobalSearch';
import { cn } from '@/lib/utils';

export type FlattenedSearchItem =
  | {
      key: string;
      kind: 'action';
      id: 'create-warehouse' | 'create-company';
      title: string;
      subtitle?: string;
      badge?: string;
    }
  | {
      key: string;
      kind: 'product' | 'warehouse' | 'document';
      id: string;
      type?: GlobalSearchDocumentType;
      title: string;
      subtitle?: string;
      badge?: string;
    };

function GroupHeader({ title }: { title: string }) {
  return (
    <div className="px-4 pt-4 pb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
      {title}
    </div>
  );
}

function ResultRow({
  item,
  active,
  onMouseEnter,
  onClick,
}: {
  item: FlattenedSearchItem;
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 flex items-start gap-3',
        'hover:bg-neutral-50',
        active && 'bg-neutral-100',
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-neutral-900 truncate">{item.title}</div>
          {item.badge && (
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-neutral-200 bg-white text-neutral-700">
              {item.badge}
            </span>
          )}
        </div>
        {item.subtitle && <div className="text-xs text-neutral-600 truncate">{item.subtitle}</div>}
      </div>
    </button>
  );
}

export function GlobalSearchResults({
  loading,
  results,
  items,
  activeIndex,
  setActiveIndex,
  onSelect,
}: {
  loading: boolean;
  results: GlobalSearchResultsData;
  items: FlattenedSearchItem[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  onSelect: (item: FlattenedSearchItem) => void;
}) {
  if (loading && items.length === 0) {
    return <div className="px-4 py-6 text-sm text-neutral-600">Searching…</div>;
  }

  const hasAny = items.length > 0;

  if (!hasAny) {
    return <div className="px-4 py-6 text-sm text-neutral-600">No results.</div>;
  }

  let indexCursor = 0;

  const renderGroup = (title: string, groupItems: FlattenedSearchItem[]) => {
    if (groupItems.length === 0) return null;

    const startIndex = indexCursor;
    indexCursor += groupItems.length;

    return (
      <div>
        <GroupHeader title={title} />
        <div className="py-1">
          {groupItems.map((item, i) => {
            const idx = startIndex + i;
            return (
              <ResultRow
                key={item.key}
                item={item}
                active={idx === activeIndex}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => onSelect(item)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const productItems = items.filter((i) => i.kind === 'product');
  const warehouseItems = items.filter((i) => i.kind === 'warehouse');
  const documentItems = items.filter((i) => i.kind === 'document');
  const actionItems = items.filter((i) => i.kind === 'action');

  return (
    <div>
      {renderGroup('Actions', actionItems)}
      {renderGroup('Products', productItems)}
      {renderGroup('Warehouses', warehouseItems)}
      {renderGroup('Documents', documentItems)}
    </div>
  );
}
