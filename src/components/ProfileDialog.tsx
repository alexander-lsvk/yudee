import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, CreditCard, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from './AvatarUpload';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/auth';
import { uploadAvatar, deleteAvatar } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { createCustomerPortalSession } from '@/lib/stripe';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface SubscriptionDetails {
  subscription_id: string | null;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
  subscription_status: string | null;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onOpenChange, onSave }) => {
  const { t } = useTranslation();
  const { user, isPremium, refreshProfile } = useAuth();
  const [name, setName] = useState(user?.profile?.name || '');
  const [lineId, setLineId] = useState(user?.profile?.line_id || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [managingSubscription, setManagingSubscription] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setName(user.profile.name);
      setLineId(user.profile.line_id || '');
      setAvatarUrl(user.profile.avatar_url || '');
    }

    if (isPremium) {
      fetchSubscriptionDetails();
    }
  }, [user, isPremium]);

  const fetchSubscriptionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .single();

      if (error) throw error;
      setSubscriptionDetails(data);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      setError(t('common.error'));
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    try {
      if (avatarUrl) {
        await deleteAvatar(avatarUrl);
      }

      const newAvatarUrl = await uploadAvatar(user.id, file);
      
      await updateProfile(user.id, {
        name,
        line_id: lineId,
        avatar_url: newAvatarUrl
      });

      setAvatarUrl(newAvatarUrl);
      await refreshProfile();
    } catch (error) {
      console.error('Error handling avatar upload:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await updateProfile(user.id, {
        name,
        line_id: lineId,
        avatar_url: avatarUrl
      });
      await refreshProfile();
      onSave();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!isPremium) {
      setError(t('common.error'));
      return;
    }

    if (!subscriptionDetails?.subscription_id) {
      setError(t('common.error'));
      return;
    }

    if (!['active', 'trialing'].includes(subscriptionDetails.subscription_status || '')) {
      setError(t('common.error'));
      return;
    }

    try {
      setManagingSubscription(true);
      setError(null);

      const url = await createCustomerPortalSession();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      setError(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setManagingSubscription(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('profile.settings')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex justify-center">
            <AvatarUpload
              name={name}
              imageUrl={avatarUrl}
              size="lg"
              onUpload={handleAvatarUpload}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">{t('profile.name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('profile.phone')}</Label>
            <Input
              id="phone"
              value={user?.profile?.phone || ''}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lineId">{t('profile.lineId')}</Label>
            <Input
              id="lineId"
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              placeholder={t('profile.lineIdPlaceholder')}
            />
          </div>

          {!user?.profile?.line_id && (
            <p className="text-sm text-amber-600">
              {t('profile.lineIdTip')}
            </p>
          )}

          {isPremium && subscriptionDetails && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">{t('profile.premium.title')}</span>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  {t('profile.premium.until', {
                    date: formatDate(subscriptionDetails.current_period_end || 0)
                  })}
                </div>
                
                {subscriptionDetails.payment_method_brand && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span>
                      {t('profile.premium.cardInfo', {
                        brand: formatCardBrand(subscriptionDetails.payment_method_brand),
                        last4: subscriptionDetails.payment_method_last4
                      })}
                    </span>
                  </div>
                )}

                {subscriptionDetails.cancel_at_period_end && (
                  <div className="text-sm text-amber-600">
                    {t('profile.premium.willEnd', {
                      date: formatDate(subscriptionDetails.current_period_end || 0)
                    })}
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={managingSubscription || !subscriptionDetails.subscription_id}
                  >
                    {managingSubscription ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('profile.premium.opening')}
                      </>
                    ) : (
                      t('profile.premium.manageSubscription')
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('profile.buttons.saving') : t('profile.buttons.saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;