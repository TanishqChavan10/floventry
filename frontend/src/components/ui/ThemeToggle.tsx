import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/theme-context';

export default function ThemeToggle({
  outline,
  fullWidth,
}: {
  outline?: boolean;
  fullWidth?: boolean;
}) {
  const { darkMode, toggleTheme } = useTheme();
  if (outline) {
    return (
      <Button variant="outline" className={fullWidth ? 'w-full my-2' : ''} onClick={toggleTheme}>
        {darkMode ? (
          <>
            <Sun className="mr-2 h-4 w-4" />
            Light Mode
          </>
        ) : (
          <>
            <Moon className="mr-2 h-4 w-4" />
            Dark Mode
          </>
        )}
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
