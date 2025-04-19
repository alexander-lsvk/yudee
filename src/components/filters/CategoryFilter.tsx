import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CategoryFilterProps {
  primaryCategories: any[];
  propertyCategories: any[];
  selectedCategories?: string[];
  selectedSecondaryCategories: any[];
  onCategoryChange: (categoryId: string, checked: boolean) => void;
}

export function CategoryFilter({
  primaryCategories,
  propertyCategories,
  selectedCategories = [],
  selectedSecondaryCategories,
  onCategoryChange
}: CategoryFilterProps) {
  const { t } = useTranslation();
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{t('propertyForm.fields.category.label')}</Label>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"
          >
            {t('filters.location.more')} <ChevronRight className="h-3 w-3" />
          </button>
          {selectedSecondaryCategories.length > 0 && (
            <>
              <div
                key={selectedSecondaryCategories[0].id}
                className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"
              >
                {selectedSecondaryCategories[0].display_name}
              </div>
              {selectedSecondaryCategories.length > 1 && (
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-full"
                >
                  +{selectedSecondaryCategories.length - 1}
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          {primaryCategories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={(checked) => onCategoryChange(category.id, checked as boolean)}
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="text-sm font-normal"
              >
                {category.display_name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('propertyForm.fields.category.allCategories')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 pt-4">
            {propertyCategories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`modal-category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => onCategoryChange(category.id, checked as boolean)}
                />
                <Label
                  htmlFor={`modal-category-${category.id}`}
                  className="text-sm font-normal"
                >
                  {category.display_name}
                </Label>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}