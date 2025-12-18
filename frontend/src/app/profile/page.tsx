'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from '@apollo/client';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { CompanyInfo } from '@/components/profile/CompanyInfo';
import { Preferences } from '@/components/profile/Preferences';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GET_CURRENT_USER, UPDATE_PREFERENCES } from '@/lib/graphql/auth';

export default function ProfilePage() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: meData } = useQuery(GET_CURRENT_USER, {
    fetchPolicy: 'cache-and-network',
  });

  const [updatePreferencesMutation] = useMutation(UPDATE_PREFERENCES);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    lowStockAlerts: true,
    expiryAlerts: true,
    poUpdates: true,
    marketingEmails: false,
    language: 'en',
    timeFormat: '12h' as '12h' | '24h',
  });

  // Load preferences from database when meData is available
  useEffect(() => {
    if (meData?.me?.preferences) {
      setPreferences(prev => ({
        ...prev,
        ...meData.me.preferences,
      }));
    }
  }, [meData]);

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      // Save profile information to Clerk
      await user?.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      // Save preferences to database
      await updatePreferencesMutation({
        variables: {
          preferences: JSON.stringify(preferences),
        },
      });

      toast.success('All changes saved successfully');
    } catch (error) {
      toast.error('Failed to save changes');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Profile & Settings</h2>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences.</p>
        </div>
        <div className="hidden lg:block">
          <Button onClick={handleSaveAll} disabled={isLoading} size="lg" className="shadow-lg">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProfileForm formData={formData} onFormDataChange={setFormData} />
        </div>
        <div className="space-y-6 flex flex-col h-full">
          <div className="flex-1">
             <CompanyInfo />
          </div>
          <div className="flex-1">
             <Preferences preferences={preferences} onPreferencesChange={setPreferences} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex justify-end gap-4 z-50 lg:hidden">
        <Button onClick={handleSaveAll} disabled={isLoading} size="lg" className="w-full sm:w-auto shadow-lg">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
