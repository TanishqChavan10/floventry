'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { CompanyInfo } from '@/components/profile/CompanyInfo';

type ProfileFormData = {
  firstName: string;
  lastName: string;
};

export default function ProfilePage() {
  const { user } = useAuth();

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    if (!user) return;

    setFormData({
      firstName: user.full_name?.split(' ')[0] || '',
      lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Profile & Settings
          </h2>
          <p className="text-slate-600 dark:text-slate-400">Manage your account settings.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="flex flex-col">
            <ProfileForm formData={formData} onFormDataChange={setFormData} />
          </div>
          <div className="flex flex-col">
            <CompanyInfo />
          </div>
        </div>
      </div>
    </div>
  );
}
