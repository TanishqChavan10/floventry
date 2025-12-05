'use client';

import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { SecuritySettings } from '@/components/profile/SecuritySettings';
import { CompanyInfo } from '@/components/profile/CompanyInfo';
import { Preferences } from '@/components/profile/Preferences';

export default function ProfilePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profile & Settings</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 space-y-4">
          <ProfileForm />
          <SecuritySettings />
        </div>
        <div className="col-span-3 space-y-4">
          <AvatarUpload />
          <CompanyInfo />
          <Preferences />
        </div>
      </div>
    </div>
  );
}
