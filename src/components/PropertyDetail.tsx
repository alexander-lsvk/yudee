import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, MapPin, Bed, Bath, Square, Phone,
  SplitSquareHorizontal, Building2, Calendar, Train, Copy, Check,
  ChevronLeft, ChevronRight, Clock, Image, Edit, Trash2, ExternalLink, Loader2
} from 'lucide-react';
import { Property } from '../types';
import Avatar from './Avatar';
import { Button } from './ui/button';
import { FullscreenImageViewer } from './FullscreenImageViewer';
import { SubscriptionDialog } from './SubscriptionDialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showContactButtons?: boolean;
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({
  property,
  onClose,
  onEdit,
  onDelete,
  showContactButtons = true
}) => {
  const { t, i18n } = useTranslation();
  const { isPremium } = useAuth();
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedType, setCopiedType] = useState<'phone' | 'line' | null>(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const commissionText = property.commissionSplit.type === 'percentage'
    ? t('propertyDetail.commission.percentage', { value: property.commissionSplit.value })
    : t('propertyDetail.commission.fixed', { value: property.commissionSplit.value.toLocaleString() });

  const priceDisplay = property.type === 'property'
    ? t('propertyDetail.price.fixed', { value: property.price?.toLocaleString() })
    : t('propertyDetail.price.range', {
      min: property.priceRange?.min.toLocaleString(),
      max: property.priceRange?.max.toLocaleString()
    });

  const areaDisplay = property.type === 'property'
    ? t('propertyDetail.area.fixed', { value: property.area.toLocaleString() })
    : t('propertyDetail.area.range', {
      min: property.area.min.toLocaleString(),
      max: property.area.max.toLocaleString()
    });

  const bedroomsDisplay = property.type === 'property'
    ? property.bedrooms
    : Array.isArray(property.bedrooms)
      ? property.bedrooms.join(' / ')
      : property.bedrooms;

  const bathsDisplay = Array.isArray(property.bathrooms)
    ? property.bathrooms.map(count => t('propertyDetail.bathrooms.count', { count })).join(' / ')
    : t('propertyDetail.bathrooms.count', { count: property.bathrooms });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) {
      return t('propertyDetail.time.minutes', { count: minutes });
    } else if (hours < 24) {
      return t('propertyDetail.time.hours', { count: hours });
    } else if (days < 7) {
      return t('propertyDetail.time.days', { count: days });
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleCopyLineId = async () => {
    if (!isPremium) {
      setShowSubscriptionDialog(true);
      return;
    }

    if (!property.contactLine) return;
    try {
      await navigator.clipboard.writeText(property.contactLine);
      setCopiedType('line');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy LINE ID:', err);
    }
  };

  const handleCopyPhone = async () => {
    if (!isPremium) {
      setShowSubscriptionDialog(true);
      return;
    }

    try {
      await navigator.clipboard.writeText(property.contactPhone);
      setCopiedType('phone');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy phone number:', err);
    }
  };

  const handleCall = () => {
    if (!isPremium) {
      setShowSubscriptionDialog(true);
      return;
    }
    window.location.href = `tel:${property.contactPhone}`;
  };

  const handleOpenLine = () => {
    if (!isPremium) {
      setShowSubscriptionDialog(true);
      return;
    }
    window.open(`https://line.me/ti/p/${property.contactLine}`, '_blank');
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const { startPremiumSubscription } = await import('@/lib/stripe');
      await startPremiumSubscription();
    } catch (error) {
      console.error('Error starting subscription:', error);
      setLoading(false);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className={`fixed inset-0 z-50 ${isMobile ? 'bg-white' : 'bg-black/80'}`}>
      <div className={`absolute inset-0 overflow-y-auto ${isMobile ? '' : 'p-4'}`}>
        <div className={`min-h-full flex items-center justify-center ${isMobile ? '' : 'p-4'}`}>
          <div className={`relative bg-white w-full ${isMobile ? 'h-full' : 'max-w-4xl rounded-lg shadow-xl'}`}>
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b">
              <div className="flex items-center gap-2">
                <span className="capitalize px-2 py-1 bg-gray-100 rounded-full text-sm font-medium">
                  {i18n.language === 'th' ? property.categoryDisplayTh : property.categoryDisplay}
                </span>
                <h2 className="text-lg font-semibold line-clamp-1">{property.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    onClick={onEdit}
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <Edit className="h-5 w-5" />
                    <span className="sr-only">{t('common.edit')}</span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    onClick={onDelete}
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="sr-only">{t('common.delete')}</span>
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6" />
                  <span className="sr-only">{t('common.close')}</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <div className={`relative bg-gray-100 ${property.images.length > 0 ? 'h-48 sm:h-64 md:h-96' : 'h-16'}`}>
                {property.images.length > 0 ? (
                  <>
                    <img
                      src={property.images[currentImageIndex]}
                      alt={property.title}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setIsFullscreen(true)}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
                      }}
                    />
                    {property.images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                          onClick={handlePrevImage}
                        >
                          <ChevronLeft className="h-6 w-6" />
                          <span className="sr-only">{t('propertyDetail.images.previous')}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                          onClick={handleNextImage}
                        >
                          <ChevronRight className="h-6 w-6" />
                          <span className="sr-only">{t('propertyDetail.images.next')}</span>
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>

              <div className={`absolute ${property.images.length > 0 ? 'top-2' : 'inset-y-0'} left-0 right-0 flex justify-between px-2 ${!property.images.length && 'items-center'}`}>
                <div className="bg-black/75 text-white px-3 py-1.5 rounded text-sm flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" />
                  {formatDate(property.createdAt)}
                </div>
                {property.images.length > 0 && (
                  <div className="bg-black/75 text-white px-3 py-1.5 rounded text-sm">
                    {t('propertyDetail.images.count', {
                      current: currentImageIndex + 1,
                      total: property.images.length
                    })}
                  </div>
                )}
              </div>

              {property.images.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                  <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-2 px-2 py-2">
                    {property.images.map((image, index) => (
                      <button
                        key={image}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative flex-shrink-0 w-12 h-12 md:w-16 md:h-16 p-0.5 rounded-lg transition-opacity ${
                          index === currentImageIndex
                            ? 'ring-2 ring-white ring-offset-0'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={image}
                          alt={t('propertyDetail.images.thumbnail', { number: index + 1 })}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <MapPin size={18} className="mr-1.5 shrink-0" />
                    <div>
                      {Array.isArray(property.location) ? property.location.join(' • ') : property.location}
                    </div>
                  </div>

                  {property.district && (
                    <div className="flex items-center text-gray-600">
                      <Building2 size={18} className="mr-1.5 shrink-0" />
                      <div>
                        <span className="font-medium">{t('propertyDetail.district')}: </span>
                        {property.district}
                      </div>
                    </div>
                  )}

                  {property.btsMrtNearby && property.btsMrtNearby.length > 0 && (
                    <div className="flex items-center text-gray-600">
                      <Train size={18} className="mr-1.5 shrink-0" />
                      <div>
                        <span className="font-medium">{t('propertyDetail.btsMrt')}: </span>
                        {property.btsMrtNearby.join(' • ')}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-blue-600 font-semibold text-xl">
                    {priceDisplay}
                  </div>
                  <div className="text-sm text-gray-500">{t('propertyDetail.pricePerMonth')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6">
                <div className="flex items-center">
                  <Bed size={20} className="mr-2 text-gray-500 shrink-0" />
                  <div>
                    <div className="font-semibold">{bedroomsDisplay}</div>
                    <div className="text-sm text-gray-500">{t('propertyDetail.bedrooms.label')}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Bath size={20} className="mr-2 text-gray-500 shrink-0" />
                  <div>
                    <div className="font-semibold">{bathsDisplay}</div>
                    <div className="text-sm text-gray-500">{t('propertyDetail.bathrooms.label')}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Square size={20} className="mr-2 text-gray-500 shrink-0" />
                  <div>
                    <div className="font-semibold">{areaDisplay}</div>
                    <div className="text-sm text-gray-500">{t('propertyDetail.area.label')}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <SplitSquareHorizontal size={20} className="mr-2 text-gray-500 shrink-0" />
                  <div>
                    <div className="font-semibold">{commissionText}</div>
                    <div className="text-sm text-gray-500">{t('propertyDetail.commission.label')}</div>
                  </div>
                </div>
              </div>

              {property.projectName && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">{t('propertyDetail.projectDetails')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">{t('propertyDetail.projectName')}: </span>
                      <span className="ml-2 font-medium">{property.projectName}</span>
                    </div>
                    {property.floor && (
                      <div>
                        <span className="text-gray-600">{t('propertyDetail.floor')}: </span>
                        <span className="ml-2 font-medium">{property.floor}</span>
                      </div>
                    )}
                    {property.buildYear && (
                      <div>
                        <span className="text-gray-600">{t('propertyDetail.buildYear')}: </span>
                        <span className="ml-2 font-medium">{property.buildYear}</span>
                      </div>
                    )}
                    {property.moveInDate && (
                      <div>
                        <span className="text-gray-600">{t('propertyDetail.moveInDate')}: </span>
                        <span className="ml-2 font-medium">
                          {new Date(property.moveInDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">{t('propertyDetail.description')}</h2>
                <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
              </div>

              {(property.amenities?.length > 0 || property.tags?.length > 0) && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">{t('propertyDetail.features')}</h2>
                  <div className="space-y-4">
                    {property.amenities?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">{t('propertyDetail.amenities')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.map((amenity, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {property.tags?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">{t('propertyDetail.tags')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {property.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.1)] sm:shadow-none">
              <div className="p-4 flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center">
                  <Avatar
                    name={property.agentName}
                    imageUrl={property.agentAvatar}
                    size="sm"
                  />
                  <div className="ml-3">
                    <div className="font-medium">{property.agentName}</div>
                    <div className="text-xs text-gray-500">{t('propertyDetail.realEstateAgent')}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {showContactButtons ? (
                    <>
                      {isMobile ? (
                        // Mobile view with icon-only buttons
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" className="bg-blue-500 hover:bg-blue-600 text-white h-10 w-10">
                                <Phone className="h-5 w-5" />
                                {copiedType === 'phone' && (
                                  <span className="absolute -top-2 -right bg-green-500 text-white text-xs p-1 rounded-full">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem onClick={handleCopyPhone}>
                                <Copy className="h-4 w-4 mr-2" />
                                {t('propertyDetail.contact.copyNumber')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleCall}>
                                <Phone className="h-4 w-4 mr-2" />
                                {t('propertyDetail.contact.call')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {property.contactLine && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" className="bg-[#00B900] hover:bg-[#009900] text-white h-10 w-10">
                                  <img 
                                    src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg"
                                    alt="LINE"
                                    className="h-5 w-5"
                                  />
                                  {copiedType === 'line' && (
                                    <span className="absolute -top-2 -right bg-green-500 text-white text-xs p-1 rounded-full">
                                      <Check className="h-3 w-3" />
                                    </span>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem onClick={handleCopyLineId}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  {t('propertyDetail.contact.copyLineId')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleOpenLine}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  {t('propertyDetail.contact.openInLine')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      ) : (
                        // Desktop view with text buttons
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                                <Phone className="h-4 w-4 mr-2" />
                                {t('propertyDetail.contact.phoneNumber')}
                                {copiedType === 'phone' && (
                                  <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                                    {t('propertyDetail.contact.copied')}
                                  </span>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem onClick={handleCopyPhone}>
                                <Copy className="h-4 w-4 mr-2" />
                                {t('propertyDetail.contact.copyNumber')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleCall}>
                                <Phone className="h-4 w-4 mr-2" />
                                {t('propertyDetail.contact.call')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {property.contactLine && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button className="bg-[#00B900] hover:bg-[#009900] text-white">
                                  <img 
                                    src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg"
                                    alt="LINE"
                                    className="h-4 w-4 mr-2"
                                  />
                                  LINE
                                  {copiedType === 'line' && (
                                    <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                                      {t('propertyDetail.contact.copied')}
                                    </span>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem onClick={handleCopyLineId}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  {t('propertyDetail.contact.copyLineId')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleOpenLine}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  {t('propertyDetail.contact.openInLine')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {onEdit && (
                        <Button
                          onClick={onEdit}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          {t('common.edit')}
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          onClick={onDelete}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('common.delete')}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFullscreen && property.images.length > 0 && (
        <FullscreenImageViewer
          images={property.images}
          currentIndex={currentImageIndex}
          onClose={() => setIsFullscreen(false)}
          onPrevious={handlePrevImage}
          onNext={handleNextImage}
        />
      )}

      <SubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
};

export default PropertyDetail;