import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Avatar from './Avatar';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileButtonProps {
  onEditProfile: () => void;
  onLogout: () => void;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ onEditProfile, onLogout }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user?.profile) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="p-0 h-10 w-10">
          <Avatar 
            name={user.profile.name} 
            imageUrl={user.profile.avatar_url} 
            size="sm" 
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>{user.profile.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEditProfile}>
          {t('profile.menu.profileSettings')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogout}>
          {t('profile.menu.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileButton;