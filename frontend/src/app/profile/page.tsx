'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/context/auth-context';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { CompanyInfo } from '@/components/profile/CompanyInfo';
import { Preferences } from '@/components/profile/Preferences';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCurrentUser, useUpdatePreferences } from '@/hooks/apollo';

const DEFAULT_PREFERENCES = {
  language: 'en',
  timeFormat: '12h' as '12h' | '24h',
};

type ProfileFormData = {
  firstName: string;
  lastName: string;
};

type PreferencesState = typeof DEFAULT_PREFERENCES;

function normalizeName(value: string): string {
  return (value ?? '').trim();
}

function arePreferencesEqual(a: PreferencesState, b: PreferencesState): boolean {
  return a.language === b.language && a.timeFormat === b.timeFormat;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { run, isLoading } = useAsyncAction();

  const { data: meData, loading: meLoading } = useCurrentUser();

  const [updatePreferencesMutation] = useUpdatePreferences();

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
  });

  const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES);

  // Baseline snapshot used to enable/disable Save.
  const [savedSnapshot, setSavedSnapshot] = useState<{
    formData: ProfileFormData;
    preferences: PreferencesState;
  } | null>(null);

  // Initialize both UI state + baseline once Supabase user AND DB prefs are loaded.
  // This prevents the Save button from becoming enabled due to async hydration.
  useEffect(() => {
    if (!user) return;
    if (meLoading) return;
    if (savedSnapshot) return;

    const initialForm: ProfileFormData = {
      firstName: user.full_name?.split(' ')[0] || '',
      lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
    };

    const initialPrefs: PreferencesState = {
      ...DEFAULT_PREFERENCES,
      ...(meData?.me?.preferences ?? {}),
    };

    setFormData(initialForm);
    setPreferences(initialPrefs);
    setSavedSnapshot({ formData: initialForm, preferences: initialPrefs });
  }, [meData, meLoading, savedSnapshot, user]);

  const hasChanges = useMemo(() => {
    if (!savedSnapshot) return false;

    const profileChanged =
      normalizeName(formData.firstName) !== normalizeName(savedSnapshot.formData.firstName) ||
      normalizeName(formData.lastName) !== normalizeName(savedSnapshot.formData.lastName);

    const prefsChanged = !arePreferencesEqual(preferences, savedSnapshot.preferences);

    return profileChanged || prefsChanged;
  }, [formData.firstName, formData.lastName, preferences, savedSnapshot]);

  const handleSaveAll = () => {
    void run(async () => {
      // Save profile information (name is stored in DB via preferences for now)
      // In future, add a dedicated updateProfile mutation
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      // Save preferences to database
      await updatePreferencesMutation({
        variables: {
          preferences: JSON.stringify(preferences),
        },
      });

      toast.success('All changes saved successfully');

      // Update baseline so Save disables again until further edits.
      setSavedSnapshot({
        formData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        preferences: { ...preferences },
      });
    }).catch((error) => {
      toast.error('Failed to save changes');
      console.error(error);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <div className="container mx-auto px-6 py-8 space-y-8 pb-28 lg:pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Profile & Settings
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your account settings and preferences.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Badge variant={hasChanges ? 'secondary' : 'outline'}>
              {hasChanges ? 'Unsaved changes' : 'Up to date'}
            </Badge>
            <Button
              onClick={handleSaveAll}
              disabled={isLoading || !hasChanges}
              size="lg"
              className="shadow-sm"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5 space-y-6">
            <ProfileForm formData={formData} onFormDataChange={setFormData} />
          </div>
          <div className="lg:col-span-7 space-y-6">
            <CompanyInfo />
            <Preferences preferences={preferences} onPreferencesChange={setPreferences} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex items-center justify-between gap-4 z-50 lg:hidden">
        <Badge className="hidden sm:inline-flex" variant={hasChanges ? 'secondary' : 'outline'}>
          {hasChanges ? 'Unsaved changes' : 'Up to date'}
        </Badge>
        <Button
          onClick={handleSaveAll}
          disabled={isLoading || !hasChanges}
          size="lg"
          className="w-full sm:w-auto shadow-sm"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
