import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RangeFilterProps {
  label: string;
  unit: string;
  value?: { min?: number; max?: number };
  onChange: (min?: number, max?: number) => void;
}

export function RangeFilter({ label, unit, value, onChange }: RangeFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="number"
            placeholder={t('propertyForm.fields.price.range.minPlaceholder')}
            value={value?.min || ''}
            onChange={(e) => onChange(
              e.target.value ? Number(e.target.value) : undefined,
              value?.max
            )}
            className="w-full pr-12"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{unit}</span>
          </div>
        </div>
        <div className="relative flex-1">
          <Input
            type="number"
            placeholder={t('propertyForm.fields.price.range.maxPlaceholder')}
            value={value?.max || ''}
            onChange={(e) => onChange(
              value?.min,
              e.target.value ? Number(e.target.value) : undefined
            )}
            className="w-full pr-12"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}