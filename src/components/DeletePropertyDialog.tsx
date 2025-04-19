import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';

interface DeletePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dealClosed: boolean) => void;
  title: string;
}

export function DeletePropertyDialog({
  open,
  onOpenChange,
  onConfirm,
  title
}: DeletePropertyDialogProps) {
  const { t } = useTranslation();
  const [showDealConfirmation, setShowDealConfirmation] = React.useState(false);

  const handleDelete = () => {
    setShowDealConfirmation(true);
  };

  const handleDealResponse = (dealClosed: boolean) => {
    onConfirm(dealClosed);
    setShowDealConfirmation(false);
  };

  const handleClose = () => {
    setShowDealConfirmation(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!showDealConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                {t('deleteDialog.title')}
              </DialogTitle>
              <DialogDescription>
                {t('deleteDialog.description', { title })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                {t('common.delete')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('deleteDialog.dealQuestion.title')}</DialogTitle>
              <DialogDescription>
                {t('deleteDialog.dealQuestion.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => handleDealResponse(false)}
              >
                {t('deleteDialog.dealQuestion.no')}
              </Button>
              <Button
                onClick={() => handleDealResponse(true)}
              >
                {t('deleteDialog.dealQuestion.yes')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}