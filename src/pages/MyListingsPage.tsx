import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMyListings } from '@/hooks/useMyListings';
import { usePropertyMutations } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/PropertyCard';
import PropertyDetail from '@/components/PropertyDetail';
import { PropertyForm } from '@/components/PropertyForm';
import { PropertySkeleton } from '@/components/PropertySkeleton';
import { DeletePropertyDialog } from '@/components/DeletePropertyDialog';
import type { Property, PropertyFormData } from '@/types';
import { deleteProperty } from '@/lib/properties';

const MyListingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'property' | 'client-request'>('all');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: properties, isLoading, refetch } = useMyListings(
    user?.id,
    activeTab === 'all' ? undefined : activeTab
  );

  const { updateProperty } = usePropertyMutations();

  const handleEdit = (property: Property) => {
    setSelectedProperty(null);
    setEditingProperty(property);
  };

  const handleDelete = (property: Property) => {
    setSelectedProperty(null);
    setDeletingProperty(property);
  };

  const handleDeleteConfirm = async (dealClosed: boolean) => {
    if (!deletingProperty) return;

    setError(null);
    setIsDeleting(true);
    try {
      await deleteProperty(deletingProperty.id, dealClosed);
      setDeletingProperty(null);
      refetch();
    } catch (error) {
      console.error('Error deleting property:', error);
      setError(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateProperty = async (data: PropertyFormData) => {
    if (!editingProperty) return;

    setError(null);
    try {
      await updateProperty.mutateAsync(editingProperty.id, data);
      setEditingProperty(null);
      refetch();
    } catch (error) {
      console.error('Error updating property:', error);
      setError(error instanceof Error ? error.message : t('common.error'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-[1385px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <Link 
              to="/"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span>{t('common.back')}</span>
            </Link>
            <h1 className="text-xl font-semibold ml-4">{t('myListings.title')}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1385px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow-sm p-0.5">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('all')}
              className="h-8"
            >
              {t('myListings.tabs.all')}
            </Button>
            <Button
              variant={activeTab === 'property' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('property')}
              className="h-8"
            >
              {t('myListings.tabs.properties')}
            </Button>
            <Button
              variant={activeTab === 'client-request' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('client-request')}
              className="h-8"
            >
              {t('myListings.tabs.clientRequests')}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <PropertySkeleton key={index} />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => setSelectedProperty(property)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t(`myListings.empty.${activeTab}.title`)}
            </h2>
            <p className="text-gray-600 mb-6">
              {t(`myListings.empty.${activeTab}.description`)}
            </p>
            <Link to="/">
              <Button>{t('myListings.createListing')}</Button>
            </Link>
          </div>
        )}
      </main>

      {selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onEdit={() => handleEdit(selectedProperty)}
          onDelete={() => handleDelete(selectedProperty)}
        />
      )}

      {editingProperty && (
        <PropertyForm
          type={editingProperty.type}
          initialData={editingProperty}
          onSubmit={handleUpdateProperty}
          onClose={() => setEditingProperty(null)}
        />
      )}

      {deletingProperty && (
        <DeletePropertyDialog
          open={true}
          onOpenChange={(open) => !open && setDeletingProperty(null)}
          onConfirm={handleDeleteConfirm}
          title={deletingProperty.title}
        />
      )}
    </div>
  );
};

export default MyListingsPage;