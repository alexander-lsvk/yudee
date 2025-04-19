import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, ArrowUpNarrowWide, ArrowDownNarrowWide } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortOption } from '@/types';

interface SortFilterProps {
  sortOption: SortOption;
  onSortChange: (value: string) => void;
}

export function SortFilter({ sortOption, onSortChange }: SortFilterProps) {
  const { t } = useTranslation();

  const getSortIcon = () => {
    switch (`${sortOption.field}-${sortOption.direction}`) {
      case 'createdAt-desc':
        return <Clock className="mr-2 h-4 w-4" />;
      case 'createdAt-asc':
        return <Clock className="mr-2 h-4 w-4 rotate-180" />;
      case 'priceRange-asc':
        return <ArrowUpNarrowWide className="mr-2 h-4 w-4" />;
      case 'priceRange-desc':
        return <ArrowDownNarrowWide className="mr-2 h-4 w-4" />;
      default:
        return <Clock className="mr-2 h-4 w-4" />;
    }
  };

  const getSortLabel = () => {
    switch (`${sortOption.field}-${sortOption.direction}`) {
      case 'createdAt-desc':
        return t('filters.sort.new');
      case 'createdAt-asc':
        return t('filters.sort.old');
      case 'priceRange-asc':
        return t('filters.sort.priceAsc');
      case 'priceRange-desc':
        return t('filters.sort.priceDesc');
      default:
        return t('filters.sort.new');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-9 flex items-center gap-1"
        >
          {getSortIcon()}
          {getSortLabel()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onSortChange('createdAt-desc')}>
          <Clock className="mr-2 h-4 w-4" />
          {t('filters.sort.new')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('createdAt-asc')}>
          <Clock className="mr-2 h-4 w-4 rotate-180" />
          {t('filters.sort.old')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('priceRange-asc')}>
          <ArrowUpNarrowWide className="mr-2 h-4 w-4" />
          {t('filters.sort.priceAsc')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('priceRange-desc')}>
          <ArrowDownNarrowWide className="mr-2 h-4 w-4" />
          {t('filters.sort.priceDesc')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}