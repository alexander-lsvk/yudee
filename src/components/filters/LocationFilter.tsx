import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Train } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LocationFilterProps {
  selectedLocations: {
    areas: any[];
    stations: any[];
  };
  groupedLocations: {
    areas: any[];
    stations: any[];
  };
  onLocationChange: (locationId: string, checked: boolean, parentId?: string) => void;
  filters: any;
}

export function LocationFilter({ selectedLocations, groupedLocations, onLocationChange, filters }: LocationFilterProps) {
  const { t } = useTranslation();
  const [showAreaModal, setShowAreaModal] = React.useState(false);
  const [showTransitModal, setShowTransitModal] = React.useState(false);

  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('propertyForm.fields.location.label')}</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 justify-between"
            onClick={() => setShowAreaModal(true)}
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="font-normal">{t('filters.location.area')}</span>
            </div>
            {selectedLocations.areas.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {selectedLocations.areas.length}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1 justify-between"
            onClick={() => setShowTransitModal(true)}
          >
            <div className="flex items-center gap-2">
              <Train className="h-4 w-4" />
              <span className="font-normal">{t('filters.location.bts')}</span>
            </div>
            {selectedLocations.stations.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {selectedLocations.stations.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Area Modal */}
      <Dialog open={showAreaModal} onOpenChange={setShowAreaModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('filters.location.selectAreas')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {groupedLocations.areas.map((area) => (
              <div key={area.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`area-${area.id}`}
                    checked={filters.location?.includes(area.id)}
                    onCheckedChange={(checked) => onLocationChange(area.id, checked as boolean)}
                  />
                  <Label
                    htmlFor={`area-${area.id}`}
                    className="font-medium"
                  >
                    {area.name}
                  </Label>
                </div>
                <div className="ml-6 grid grid-cols-2 gap-2">
                  {area.subAreas.map((subArea) => (
                    <div key={subArea.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subarea-${subArea.id}`}
                        checked={filters.location?.includes(subArea.id)}
                        onCheckedChange={(checked) => onLocationChange(subArea.id, checked as boolean, area.id)}
                      />
                      <Label
                        htmlFor={`subarea-${subArea.id}`}
                        className="text-sm"
                      >
                        {subArea.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transit Modal */}
      <Dialog open={showTransitModal} onOpenChange={setShowTransitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('filters.location.selectStations')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 pt-4">
            {groupedLocations.stations.map((station) => (
              <div key={station.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`station-${station.id}`}
                  checked={filters.location?.includes(station.id)}
                  onCheckedChange={(checked) => onLocationChange(station.id, checked as boolean)}
                />
                <Label
                  htmlFor={`station-${station.id}`}
                  className="text-sm"
                >
                  {station.name}
                </Label>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}