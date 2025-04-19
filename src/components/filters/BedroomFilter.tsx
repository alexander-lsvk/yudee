import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface BedroomFilterProps {
  propertyBedrooms: any[];
  selectedBedrooms?: string[];
  onBedroomChange: (bedroomId: string, checked: boolean) => void;
}

export function BedroomFilter({ propertyBedrooms, selectedBedrooms = [], onBedroomChange }: BedroomFilterProps) {
  const { t } = useTranslation();

  const formatBedroomLabel = (name: string) => {
    if (name === 'studio') return t('propertyDetail.bedrooms.studio');
    if (name === '4-bedroom+') return t('propertyDetail.bedrooms.4plus');
    const num = name.replace('-bedroom', '');
    return t(`propertyDetail.bedrooms.${num}`);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{t('propertyForm.fields.bedrooms.label')}</Label>
      <div className="flex flex-wrap gap-4">
        {propertyBedrooms.map((bedroom) => (
          <div key={bedroom.id} className="flex items-center space-x-2">
            <Checkbox
              id={`bedroom-${bedroom.id}`}
              checked={selectedBedrooms.includes(bedroom.id)}
              onCheckedChange={(checked) => onBedroomChange(bedroom.id, checked as boolean)}
            />
            <Label
              htmlFor={`bedroom-${bedroom.id}`}
              className="text-sm font-normal"
            >
              {formatBedroomLabel(bedroom.name)}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}