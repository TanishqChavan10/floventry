import { useTheme } from '@/context/theme-context';

export default function ThemeToggle({
  outline,
  fullWidth,
}: {
  outline?: boolean;
  fullWidth?: boolean;
}) {
  // Light-mode only: keep component for compatibility, but render nothing.
  // (This avoids confusing users with a dark-mode toggle that doesn't exist.)
  useTheme();
  void outline;
  void fullWidth;
  return null;
}
