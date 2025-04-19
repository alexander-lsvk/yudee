import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Bed, BedDouble, Bath, Square, SplitSquareHorizontal, Calendar, Train, Image } from 'lucide-react';
import { Property } from '../types';
import Avatar from './Avatar';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  const { t, i18n } = useTranslation();

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
    ? String(property.bedrooms).replace(/-bedroom/g, '')
    : Array.isArray(property.bedrooms)
      ? property.bedrooms.map((b: string) => b.replace(/-bedroom/g, '')).join(' / ')
      : String(property.bedrooms).replace(/-bedroom/g, '');


  const bathsDisplay = Array.isArray(property.bathrooms)
    ? property.bathrooms.map(count => t('propertyDetail.bathrooms.count', { count })).join('/')
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

  const formatLocationList = (locations: string[]) => {
    return locations.join(' • ');
  };

  return (
    <div
      className="group bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg flex flex-col h-full border border-gray-100"
      onClick={onClick}
    >
      <div className="relative h-48">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <Image className="w-12 h-12 text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <div className="bg-black/75 text-white px-2 py-1 rounded-full text-sm flex items-center gap-1">
            <Calendar size={14} className="shrink-0" />
            {formatDate(property.createdAt)}
          </div>
          <div className={`px-2 py-1 rounded-full text-sm font-medium ${property.type === 'property'
              ? 'bg-blue-500 text-white'
              : 'bg-purple-500 text-white'
            }`}>
            {property.type === 'property' ? t('myListings.tabs.properties') : t('myListings.tabs.clientRequests')}
          </div>
        </div>
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-gray-900 px-2 py-1 rounded-full text-sm font-medium">
          {i18n.language === 'th' ? property.categoryDisplayTh : property.categoryDisplay}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <h3 className="text-lg font-semibold text-white line-clamp-1">{property.title}</h3>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="text-blue-600 font-semibold text-lg mb-3">
          {priceDisplay}
          <span className="text-sm text-gray-500 font-normal ml-1">{t('propertyDetail.pricePerMonth')}</span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{property.description}</p>
        <div className="space-y-2">
          <div className="flex items-start gap-1.5">
            <MapPin size={16} className="shrink-0 mt-1 text-gray-500" />
            <div className="text-sm text-gray-600">
              {formatLocationList(Array.isArray(property.location) ? property.location.map(loc => loc.name) : [property.location])}
            </div>
          </div>

          {property.btsMrtNearby && property.btsMrtNearby.length > 0 && (
            <div className="flex items-start gap-1.5">
              <Train size={16} className="shrink-0 mt-1 text-gray-500" />
              <div className="text-sm text-gray-600">
                <span className="font-medium">{t('propertyDetail.btsMrt')}: </span>
                {formatLocationList(property.btsMrtNearby)}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 my-4 py-1">
          <div className="flex items-center gap-1.5">
            <BedDouble size={16} className="shrink-0 text-gray-500" />
            <span className="text-sm font-medium">{bedroomsDisplay}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath size={16} className="shrink-0 text-gray-500" />
            <span className="text-sm font-medium">{bathsDisplay}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Square size={16} className="shrink-0 text-gray-500" />
            <span className="text-sm font-medium">{areaDisplay}</span>
          </div>
        </div>

        {property.tags && property.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {property.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
            {property.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full text-xs">
                +{property.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar
              name={property.agentName}
              imageUrl={property.agentAvatar}
              size="sm"
            />
            <span className="text-sm font-medium text-gray-700">{property.agentName}</span>
          </div>
          <div className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full">
            <SplitSquareHorizontal size={14} className="shrink-0 mr-1.5" />
            <span className="text-sm font-medium">{commissionText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
