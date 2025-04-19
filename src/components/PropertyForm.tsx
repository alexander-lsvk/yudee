import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2 } from 'lucide-react';
import { useReferenceData } from '@/hooks/useReferenceData';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { VisuallyHidden } from './ui/visually-hidden';
import { PropertyFormData, Property } from '@/types';
import { ImageUpload } from './ImageUpload';
import { uploadPropertyImage, deletePropertyImage } from '@/lib/storage';

interface PropertyFormProps {
  type: 'property' | 'client-request';
  initialData?: Property;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onClose: () => void;
}

export default function PropertyForm({ type, initialData, onSubmit, onClose }: PropertyFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const referenceData = useReferenceData();
  const { loading: referenceDataLoading, error: referenceDataError, initialized } = referenceData;

  const [formData, setFormData] = useState<Omit<PropertyFormData, 'images'>>(() =>
    initialized ? initializeFormData(type, initialData, referenceData) : {
      type,
      category_id: null, // Changed from empty string to null
      title: initialData?.title || '',
      description: initialData?.description || '',
      location: [],
      amenities: [],
      tags: [],
      price: undefined,
      priceRange: undefined,
      area: undefined,
      bedroomId: '',
      selectedBedrooms: [],
      bathrooms: 1,
      commissionSplit: {
        type: 'percentage',
        value: 50
      },
      projectName: '',
      floor: undefined,
      moveInDate: undefined,
      buildYear: undefined
    }
  );

  useEffect(() => {
    if (initialized) {
      setFormData(initializeFormData(type, initialData, referenceData));
    }
  }, [initialized, type, initialData]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<string[]>(initialData?.images || []);

  const handleImageUpload = async (file: File) => {
    setUploadingImages(true);
    try {
      const imageUrl = await uploadPropertyImage(file);
      setImages(prev => [...prev, imageUrl]);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageRemove = async (url: string) => {
    try {
      await deletePropertyImage(url);
      setImages(prev => prev.filter(image => image !== url));
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        bedroomId: type === 'property' ? formData.bedroomId : formData.selectedBedrooms[0],
        images
      };
      await onSubmit(submitData as PropertyFormData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = React.useMemo(() => {
    const requiredFields = {
      category: !!formData.category_id, // Check for actual UUID value
      title: !!formData.title.trim(),
      description: !!formData.description.trim(),
      location: formData.location.length > 0,
      bedrooms: type === 'property' ? !!formData.bedroomId : formData.selectedBedrooms.length > 0,
      bathrooms: formData.bathrooms > 0
    };

    if (type === 'property') {
      return (
        Object.values(requiredFields).every(Boolean) &&
        typeof formData.price === 'number' &&
        typeof formData.area === 'number'
      );
    } else {
      const hasPriceField = formData.priceRange?.min || formData.priceRange?.max;
      const hasAreaField = typeof formData.area === 'object' && (formData.area.min || formData.area.max);

      return (
        Object.values(requiredFields).every(Boolean) &&
        (hasPriceField || hasAreaField)
      );
    }
  }, [formData, type]);

  if (referenceDataLoading) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent>
          <VisuallyHidden>
            <DialogTitle>{t('common.loading')}</DialogTitle>
          </VisuallyHidden>
          <div className="p-4 text-center">{t('common.loading')}</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (referenceDataError) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent>
          <VisuallyHidden>
            <DialogTitle>{t('common.error')}</DialogTitle>
          </VisuallyHidden>
          <div className="p-4 text-red-500">
            {t('common.error')}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formTitle = initialData
    ? t(`propertyForm.title.edit.${type}`)
    : t(`propertyForm.title.new.${type}`);

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="flex flex-col w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl p-0 gap-0 m-0 rounded-none md:rounded-lg">
        <VisuallyHidden>
          <DialogTitle>{formTitle}</DialogTitle>
        </VisuallyHidden>

        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-sm font-medium bg-gray-100 rounded-full">
              {type === 'property' ? t('myListings.tabs.properties') : t('myListings.tabs.clientRequests')}
            </span>
            <h2 className="text-lg font-semibold">{formTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-colors rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
            <span className="sr-only">{t('common.close')}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-24">
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-700">{t('propertyForm.contact.title')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('propertyForm.contact.phone')}</Label>
                  <Input
                    value={user?.profile?.phone || ''}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label>{t('propertyForm.contact.lineId')}</Label>
                  <Input
                    value={user?.profile?.line_id || ''}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>
              {!user?.profile?.line_id && (
                <p className="text-sm text-amber-600">
                  {t('propertyForm.contact.lineIdTip')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('propertyForm.images.label')}</Label>
              <ImageUpload
                images={images}
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                uploading={uploadingImages}
              />
            </div>

            <div>
              <Label>{t('propertyForm.fields.category.label')}</Label>
              <Select
                value={formData.category_id || undefined} // Handle null value
                onValueChange={(value) => {
                  setFormData({ ...formData, category_id: value || null }); // Set to null if empty
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('propertyForm.fields.category.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {referenceData.propertyCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('propertyForm.fields.location.label')}</Label>
              <div className="space-y-4 mt-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('propertyForm.fields.location.areas')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {referenceData.locations
                      .filter(l => l.type === 'area')
                      .map((location) => (
                        <Button
                          key={location.id}
                          type="button"
                          variant={formData.location.includes(location.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              location: prev.location.includes(location.id)
                                ? prev.location.filter(id => id !== location.id)
                                : [...prev.location, location.id]
                            }));
                          }}
                        >
                          {location.name}
                        </Button>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('propertyForm.fields.location.subAreas')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {referenceData.locations
                      .filter(l => l.type === 'sub_area')
                      .map((location) => (
                        <Button
                          key={location.id}
                          type="button"
                          variant={formData.location.includes(location.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              location: prev.location.includes(location.id)
                                ? prev.location.filter(id => id !== location.id)
                                : [...prev.location, location.id]
                            }));
                          }}
                        >
                          {location.name}
                        </Button>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('propertyForm.fields.location.stations')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {referenceData.locations
                      .filter(l => l.type === 'bts' || l.type === 'mrt')
                      .map((location) => (
                        <Button
                          key={location.id}
                          type="button"
                          variant={formData.location.includes(location.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              location: prev.location.includes(location.id)
                                ? prev.location.filter(id => id !== location.id)
                                : [...prev.location, location.id]
                            }));
                          }}
                        >
                          {location.name}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label>{t('propertyForm.fields.title.label')}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('propertyForm.fields.title.placeholder')}
              />
            </div>

            <div>
              <Label>{t('propertyForm.fields.description.label')}</Label>
              <textarea
                className="w-full min-h-[100px] p-2 border rounded-md text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('propertyForm.fields.description.placeholder')}
              />
            </div>

            {type === 'client-request' && (
              <div>
                <Label>{t('propertyForm.fields.moveInDate.label')}</Label>
                <Input
                  type="date"
                  value={formData.moveInDate || ''}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                />
              </div>
            )}

            {type === 'property' ? (
              <div>
                <Label>{t('propertyForm.fields.price.label')}</Label>
                <Input
                  type="number"
                  value={formData.price ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    price: e.target.value ? Number(e.target.value) : undefined
                  })}
                  placeholder={t('propertyForm.fields.price.placeholder')}
                  min="0"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('propertyForm.fields.price.range.min')}</Label>
                  <Input
                    type="number"
                    value={formData.priceRange?.min ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      priceRange: {
                        ...formData.priceRange,
                        min: e.target.value ? Number(e.target.value) : undefined
                      }
                    })}
                    placeholder={t('propertyForm.fields.price.range.minPlaceholder')}
                    min="0"
                  />
                </div>
                <div>
                  <Label>{t('propertyForm.fields.price.range.max')}</Label>
                  <Input
                    type="number"
                    value={formData.priceRange?.max ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      priceRange: {
                        ...formData.priceRange,
                        max: e.target.value ? Number(e.target.value) : undefined
                      }
                    })}
                    placeholder={t('propertyForm.fields.price.range.maxPlaceholder')}
                    min="0"
                  />
                </div>
              </div>
            )}

            {type === 'property' ? (
              <div>
                <Label>{t('propertyForm.fields.area.label')}</Label>
                <Input
                  type="number"
                  value={formData.area ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    area: e.target.value ? Number(e.target.value) : undefined
                  })}
                  placeholder={t('propertyForm.fields.area.placeholder')}
                  min="0"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('propertyForm.fields.area.range.min')}</Label>
                  <Input
                    type="number"
                    value={typeof formData.area === 'object' ? formData.area.min : ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      area: {
                        min: e.target.value,
                        max: typeof formData.area === 'object' ? formData.area.max : ''
                      }
                    })}
                    placeholder={t('propertyForm.fields.area.range.minPlaceholder')}
                    min="0"
                  />
                </div>
                <div>
                  <Label>{t('propertyForm.fields.area.range.max')}</Label>
                  <Input
                    type="number"
                    value={typeof formData.area === 'object' ? formData.area.max : ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      area: {
                        min: typeof formData.area === 'object' ? formData.area.min : '',
                        max: e.target.value
                      }
                    })}
                    placeholder={t('propertyForm.fields.area.range.maxPlaceholder')}
                    min="0"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>{t('propertyForm.fields.bedrooms.label')}</Label>
              {type === 'property' ? (
                <Select
                  value={formData.bedroomId || undefined} // Handle empty string
                  onValueChange={(value) => {
                    setFormData({ ...formData, bedroomId: value || '' }); // Set to empty string if no value
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('propertyForm.fields.bedrooms.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {referenceData.propertyBedrooms.map((bedroom) => (
                      <SelectItem key={bedroom.id} value={bedroom.id}>
                        {bedroom.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {referenceData.propertyBedrooms.map((bedroom) => (
                    <Button
                      key={bedroom.id}
                      type="button"
                      variant={formData.selectedBedrooms.includes(bedroom.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          selectedBedrooms: prev.selectedBedrooms.includes(bedroom.id)
                            ? prev.selectedBedrooms.filter(id => id !== bedroom.id)
                            : [...prev.selectedBedrooms, bedroom.id]
                        }));
                      }}
                    >
                      {bedroom.display_name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>{t('propertyForm.fields.bathrooms.label')}</Label>
              <Select
                value={formData.bathrooms.toString()}
                onValueChange={(value) => {
                  setFormData({ ...formData, bathrooms: parseInt(value, 10) });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('propertyForm.fields.bathrooms.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {t(num === 1 ? 'propertyForm.fields.bathrooms.single' : 'propertyForm.fields.bathrooms.multiple')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('propertyForm.fields.amenities.label')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {referenceData.amenities.map((amenity) => (
                  <Button
                    key={amenity.id}
                    type="button"
                    variant={formData.amenities.includes(amenity.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        amenities: prev.amenities.includes(amenity.id)
                          ? prev.amenities.filter(id => id !== amenity.id)
                          : [...prev.amenities, amenity.id]
                      }));
                    }}
                    className="transition-colors"
                  >
                    {amenity.display_name}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>{t('propertyForm.fields.tags.label')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {referenceData.tags.map((tag) => (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={formData.tags.includes(tag.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        tags: prev.tags.includes(tag.id)
                          ? prev.tags.filter(id => id !== tag.id)
                          : [...prev.tags, tag.id]
                      }));
                    }}
                  >
                    {tag.display_name}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>{t('propertyForm.fields.commission.label')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={formData.commissionSplit.type}
                  onValueChange={(value: 'percentage' | 'fixed') =>
                    setFormData(prev => ({
                      ...prev,
                      commissionSplit: { ...prev.commissionSplit, type: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t('propertyForm.fields.commission.type.percentage')}</SelectItem>
                    <SelectItem value="fixed">{t('propertyForm.fields.commission.type.fixed')}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={formData.commissionSplit.value || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      commissionSplit: {
                        ...prev.commissionSplit,
                        value: value === '' ? 0 : parseFloat(value)
                      }
                    }));
                  }}
                  min="0"
                  step={formData.commissionSplit.type === 'percentage' ? '1' : '1000'}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:static bg-white border-t p-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('propertyForm.buttons.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting || uploadingImages}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {initialData
                  ? t('propertyForm.buttons.saving')
                  : type === 'property'
                    ? t('propertyForm.buttons.listing')
                    : t('propertyForm.buttons.posting')
                }
              </div>
            ) : (
              initialData
                ? t('propertyForm.buttons.update')
                : t(`propertyForm.buttons.create.${type}`)
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function initializeFormData(
  type: 'property' | 'client-request',
  initialData: Property | undefined,
  referenceData: ReturnType<typeof useReferenceData>
): Omit<PropertyFormData, 'images'> {
  const {
    locations,
    amenities,
    tags,
    propertyCategories,
    propertyBedrooms,
  } = referenceData;

  console.log('initialData loc:', initialData?.location);
  console.log('referenceData loc:', referenceData.locations);
  // Find category by name since we store the name in the database
  const categoryId = initialData?.category
    ? propertyCategories.find(c => c.name === initialData.category)?.id
    : null; // Changed from empty string to null

  // Match locations by name since we store names in the database
  const locationIds: string[] = (initialData?.location ?? [])
    // initialData.location is now { id: string; name: string }[]
    .map(locItem => locItem.id)                        // pull out the UUID
    .filter(id => referenceData.locations.some(l => l.id === id));

  // Match amenities by name since we store names in the database
  const amenityIds = initialData?.amenities?.map(amenityName => {
    const amenity = amenities.find(a =>
      a.name === amenityName || // Match English name
      a.display_name_th === amenityName // Match Thai name
    );
    return amenity?.id;
  }).filter(Boolean) || [];

  // Match tags by name since we store names in the database
  const tagIds = initialData?.tags?.map(tagName => {
    const tag = tags.find(t =>
      t.name === tagName || // Match English name
      t.display_name_th === tagName // Match Thai name
    );
    return tag?.id;
  }).filter(Boolean) || [];

  // Match bedroom by name since we store names in the database
  const bedroomId = initialData?.type === 'property' && initialData.bedrooms
    ? propertyBedrooms.find(b =>
      b.name === initialData.bedrooms || // Match English name
      b.display_name_th === initialData.bedrooms // Match Thai name
    )?.id || ''
    : '';

  // Match bedrooms for client request
  const selectedBedroomIds = initialData?.type === 'client-request' && initialData.bedrooms
    ? (Array.isArray(initialData.bedrooms) ? initialData.bedrooms : [initialData.bedrooms])
      .map(name => {
        const bedroom = propertyBedrooms.find(b =>
          b.name === name || // Match English name
          b.display_name_th === name // Match Thai name
        );
        return bedroom?.id;
      })
      .filter(Boolean)
    : [];

  return {
    type,
    category_id: categoryId,
    title: initialData?.title || '',
    description: initialData?.description || '',
    location: locationIds as string[],
    amenities: amenityIds as string[],
    tags: tagIds as string[],
    price: initialData?.type === 'property' ? initialData.price : undefined,
    priceRange: initialData?.type === 'client-request' ? initialData.priceRange : undefined,
    area: initialData?.area || undefined,
    bedroomId: bedroomId || '',
    selectedBedrooms: selectedBedroomIds as string[],
    bathrooms: initialData?.bathrooms || 1,
    commissionSplit: initialData?.commissionSplit || {
      type: 'percentage',
      value: 50
    },
    projectName: initialData?.projectName || '',
    floor: initialData?.floor,
    moveInDate: initialData?.moveInDate?.toISOString().split('T')[0],
    buildYear: initialData?.buildYear
  };
}

export { PropertyForm };