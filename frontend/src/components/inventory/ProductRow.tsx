import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { formatIndianRupee } from '@/lib/formatters';

type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  minCount: number;
};

interface ProductRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductRow({ product, onEdit, onDelete }: ProductRowProps) {
  const getProductStatus = (product: Product) => {
    if (product.quantity <= product.minCount) {
      return { label: 'Low Stock', variant: 'destructive' as const };
    }
    return { label: 'In Stock', variant: 'default' as const };
  };

  const status = getProductStatus(product);

  return (
    <tr
      key={product.id}
      className="border-b border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
    >
      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{product.category}</td>
      <td className="py-3 px-4 text-gray-900 dark:text-white">
        {formatIndianRupee(product.price)}
      </td>
      <td className="py-3 px-4 text-gray-900 dark:text-white">{product.quantity}</td>
      <td className="py-3 px-4 text-gray-900 dark:text-white">{product.minCount}</td>
      <td className="py-3 px-4">
        <Badge
          variant={status.variant}
          className={
            status.variant === 'destructive'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }
        >
          {status.label}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(product)} className="p-1 h-8 w-8">
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(product)}
            className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
