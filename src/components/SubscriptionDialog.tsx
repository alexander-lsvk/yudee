import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: () => void;
}

export function SubscriptionDialog({
  open,
  onOpenChange,
  onSubscribe,
}: SubscriptionDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      await onSubscribe();
    } catch (error) {
      console.error('Error starting subscription:', error);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center text-center">
            <Crown className="h-5 w-5 text-yellow-500" />
            {t('subscription.title')}
          </DialogTitle>
          
          <DialogDescription className="space-y-3 pt-3">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-24 h-24 mb-4">
                <img 
                  src="/yudee-icon.png"
                  alt="Yudee Logo"
                  className="w-full h-full"
                />
              </div>
            </div>

            <p className="text-base leading-relaxed">
              {t('subscription.features.contacts')}<br />
              {t('subscription.features.line')}<br />
              {t('subscription.features.unlimited')}
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-700 font-semibold text-lg">
                {t('subscription.offer')}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('subscription.buttons.maybeLater')}
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('subscription.buttons.continue')}
              </>
            ) : (
              t('subscription.buttons.continue')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}