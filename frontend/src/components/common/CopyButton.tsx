'use client';

import { useCallback } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

type CopyButtonProps = {
  value: string;
  successMessage?: string;
  failureMessage?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  stopPropagation?: boolean;
};

async function copyToClipboard(value: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';

  document.body.appendChild(textarea);
  textarea.select();

  try {
    const ok = document.execCommand('copy');
    return ok;
  } finally {
    document.body.removeChild(textarea);
  }
}

export function CopyButton({
  value,
  successMessage = 'Copied to clipboard',
  failureMessage = 'Failed to copy',
  ariaLabel = 'Copy to clipboard',
  className,
  disabled,
  stopPropagation = true,
}: CopyButtonProps) {
  const onCopy = useCallback(async () => {
    if (!value) return;

    try {
      const ok = await copyToClipboard(value);
      if (ok) toast.success(successMessage);
      else toast.error(failureMessage);
    } catch {
      toast.error(failureMessage);
    }
  }, [failureMessage, successMessage, value]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        void onCopy();
      }}
      disabled={disabled || !value}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <Copy className="h-4 w-4" />
    </Button>
  );
}
