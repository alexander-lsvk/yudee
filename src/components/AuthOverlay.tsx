import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { signInWithPhone, verifyOtp, createProfile } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitch } from './LanguageSwitch';

interface AuthOverlayProps {
  onSuccess: () => void;
}

export function AuthOverlay({ onSuccess }: AuthOverlayProps) {
  const { t } = useTranslation();
  const { refreshProfile } = useAuth();
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      console.log('[AuthOverlay] Sending OTP to:', phone);
      const { error } = await signInWithPhone(phone);
      if (error) throw error;
      console.log('[AuthOverlay] OTP sent successfully');
      setStep('otp');
    } catch (err: any) {
      console.error('[AuthOverlay] Error sending OTP:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      console.log('[AuthOverlay] Starting OTP verification');
      const { data, error } = await verifyOtp(phone, token);
      if (error) throw error;

      const { user } = data;
      if (!user) {
        console.error('[AuthOverlay] No user data after OTP verification');
        throw new Error('Authentication failed');
      }

      console.log('[AuthOverlay] OTP verified successfully, user:', user.id);

      // Create initial profile
      console.log('[AuthOverlay] Creating initial profile');
      const { error: profileError } = await createProfile(phone);
      if (profileError) {
        console.error('[AuthOverlay] Error creating initial profile:', profileError);
      }

      // Wait a moment for the auth state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh the profile
      console.log('[AuthOverlay] Refreshing profile after verification');
      await refreshProfile();
      console.log('[AuthOverlay] Profile refresh completed');

      // Show name step
      setStep('name');
    } catch (err: any) {
      console.error('[AuthOverlay] Error in verification:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      console.log('[AuthOverlay] Starting profile update with name:', name);
      const { profile, error } = await createProfile(phone, name);
      
      if (error) throw error;
      if (!profile) throw new Error('Failed to update profile');

      console.log('[AuthOverlay] Profile updated successfully:', profile.id);

      // Wait a moment for the profile update to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh profile and complete
      console.log('[AuthOverlay] Refreshing profile after update');
      await refreshProfile();
      console.log('[AuthOverlay] Profile refresh completed, calling onSuccess');
      onSuccess();
    } catch (err: any) {
      console.error('[AuthOverlay] Error updating profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      console.log('[AuthOverlay] User skipping name step');
      console.log('[AuthOverlay] Refreshing profile before closing');
      await refreshProfile();
      console.log('[AuthOverlay] Profile refresh completed, calling onSuccess');
      onSuccess();
    } catch (err) {
      console.error('[AuthOverlay] Error in skip handler:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative bg-white p-8 rounded-lg shadow-2xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
            <div className="absolute top-4 right-4">
              <LanguageSwitch />
            </div>
            
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 mb-4">
                <img 
                  src="/yudee-icon.png"
                  alt="Yudee Logo"
                  className="w-full h-full"
                />
              </div>
              <h1 className="text-2xl font-semibold text-center">{t('auth.welcome')}</h1>
              <p className="text-gray-600 text-center mt-2">
                {t('auth.welcomeDescription')}
              </p>
            </div>

            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <Label htmlFor="phone">{t('auth.phoneNumber')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t('auth.phonePlaceholder')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? t('auth.sending') : t('auth.sendCode')}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <Label htmlFor="token">{t('auth.verificationCode')}</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder={t('auth.codePlaceholder')}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? t('auth.verifying') : t('auth.verify')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('phone')}
                  disabled={loading}
                >
                  {t('auth.back')}
                </Button>
              </form>
            )}

            {step === 'name' && (
              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('auth.name')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('auth.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? t('auth.creatingAccount') : t('auth.completeSetup')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSkip}
                  disabled={loading}
                >
                  {t('auth.skipForNow')}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}