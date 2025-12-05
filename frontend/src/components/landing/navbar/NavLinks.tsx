import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Suppliers', href: '/suppliers' },
  { label: 'Transactions', href: '/transactions' },
  { label: 'Reports', href: '/reports' },
  { label: 'Settings', href: '/company/settings' },
  { label: 'Profile', href: '/profile' },
  { label: 'Billing', href: '/billing' },
  { label: 'Team', href: '/company/team' },
];

export default function NavLinks({
  onClick,
  className,
  isAuthenticated = false,
}: {
  onClick?: () => void;
  className?: string;
  isAuthenticated?: boolean;
}) {
  const pathname = usePathname();

  // Don't render navigation links if user is not authenticated
  if (!isAuthenticated) {
    return <div className={className}></div>;
  }

  return (
    <div className={className}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClick}
          className={`text-lg font-medium transition-colors px-1 ${
            pathname === item.href
              ? 'text-black dark:text-white font-semibold underline underline-offset-4'
              : 'text-neutral-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
