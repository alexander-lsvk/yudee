import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ListFilter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PropertyFilters, SortOption, Property, PropertyFormData } from '../types';
import PropertyCard from '../components/PropertyCard';
import { PropertyForm } from '../components/PropertyForm';
import PropertyDetail from '../components/PropertyDetail';
import SearchFilters from '../components/SearchFilters';
import { useProperties, usePropertyMutations } from '../hooks/useProperties';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthOverlay } from '@/components/AuthOverlay';
import ProfileButton from '@/components/ProfileButton';
import ProfileDialog from '@/components/ProfileDialog';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const PropertiesPage = () => {
  const { t } = useTranslation();
  const { user, loading, refreshProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'property' | 'client-request'>('property');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'property' | 'client-request'>('property');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filters, setFilters] = useState<PropertyFilters>({ type: activeTab });
  const [sortOption, setSortOption] = useState<SortOption>({ field: 'createdAt', direction: 'desc' });
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: properties, isLoading, error: fetchError, refetch } = useProperties(filters, sortOption);
  const { createProperty, updateProperty, deleteProperty } = usePropertyMutations();

  const handleProfileUpdate = async () => {
    setShowProfileDialog(false);
  };

  const handlePropertySubmit = async (data: PropertyFormData) => {
    try {
      if (selectedProperty) {
        await updateProperty.mutateAsync(selectedProperty.id, data);
      } else {
        await createProperty.mutateAsync(data);
      }
      setShowForm(false);
      setSelectedProperty(null);
      refetch();
    } catch (error) {
      console.error("Error submitting property:", error);
      let message = t('common.errorOccurred');

      if (error instanceof Error) {
        if (error.message.includes('valid_area_range')) {
          message = t('propertyForm.errors.areaRange');
        } else if (error.message.includes('valid_price_range')) {
          message = t('propertyForm.errors.priceRange');
        } else if (error.message.includes('required')) {
          message = t('propertyForm.errors.required');
        } else if (error.message.includes('invalid_number')) {
          message = t('propertyForm.errors.invalidNumber');
        } else if (error.message.includes('min_max')) {
          message = t('propertyForm.errors.minMax');
        } else if (error.message.includes('property_images')) {
          message = t('propertyForm.errors.imageUpload');
        }
      }

      setErrorMessage(message);
      setShowErrorDialog(true);
    }
  };

  const handleDelete = async (property: Property) => {
    try {
      await deleteProperty.mutateAsync(property.id);
      refetch();
    } catch (error) {
      console.error("Error deleting property:", error);
      setShowErrorDialog(true);
    }
  };

  const handleFilterChange = useCallback((newFilters: PropertyFilters) => {
    console.log('Applying filters:', newFilters);
    setFilters(newFilters);
  }, []);

  const handleTabChange = useCallback((newTab: 'property' | 'client-request') => {
    setActiveTab(newTab);
    setFilters({ type: newTab });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-[1385px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Yudee</h1>
              <LanguageSwitch />
            </div>
            {user && !loading && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setFormType(activeTab);
                    setShowForm(true);
                  }}
                  size="sm"
                  className="hidden md:flex h-9 px-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">{t('header.newPost')}</span>
                </Button>

                {/* 
                <Button
                  onClick={() => setShowForm(true)}
                  size="sm"
                  className="hidden md:flex bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 items-center gap-2 h-9 px-4"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('header.newPost')}</span>
                </Button> */}
                <Link to="/my-listings">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-4"
                  >
                    <ListFilter className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">{t('header.myListings')}</span>
                  </Button>
                </Link>
                <div className="w-px h-6 bg-gray-200" />
                <ProfileButton
                  onEditProfile={() => setShowProfileDialog(true)}
                  onLogout={signOut}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1385px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-center mb-3">
          <div className="bg-white rounded-lg shadow-sm p-0.5">
            <Button
              variant={activeTab === 'property' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('property')}
              className="h-8"
            >
              {t('myListings.tabs.properties')}
            </Button>
            <Button
              variant={activeTab === 'client-request' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('client-request')}
              className="h-8"
            >
              {t('myListings.tabs.clientRequests')}
            </Button>
          </div>
        </div>

        <div className="mb-3">
          <SearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onApplyFilters={refetch}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={() => setSelectedProperty(property)}
            />
          ))}
        </div>

        {!isLoading && properties.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('propertyDetail.noResults')}</p>
          </div>
        )}

        {user && !loading && (
          <button
            onClick={() => {
              setFormType(activeTab);
              setShowForm(true);
            }}
            className="md:hidden fixed right-4 bottom-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200"
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">{t('header.newPost')}</span>
          </button>
        )}
      </main>

      {!loading && !user && (
        <AuthOverlay onSuccess={refreshProfile} />
      )}

      {showForm && user && (
        <PropertyForm
          type={formType}
          onSubmit={handlePropertySubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          showContactButtons={!!user}
        />
      )}

      <ProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        onSave={handleProfileUpdate}
      />

      {showErrorDialog && (
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">{t('common.error')}</DialogTitle>
              <DialogDescription>
                {errorMessage}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PropertiesPage;