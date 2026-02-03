'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Globe, Clock } from 'lucide-react';

interface PreferencesProps {
  preferences: {
    language: string;
    timeFormat: '12h' | '24h';
  };
  onPreferencesChange: (preferences: PreferencesProps['preferences']) => void;
}

export function Preferences({ preferences, onPreferencesChange }: PreferencesProps) {
  const handleToggle = (key: keyof PreferencesProps['preferences']) => {
    onPreferencesChange({
      ...preferences,
      [key]: !preferences[key as keyof typeof preferences],
    });
  };

  const handleChange = (key: keyof PreferencesProps['preferences'], value: any) => {
    onPreferencesChange({
      ...preferences,
      [key]: value,
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* UX Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Settings className="h-4 w-4" /> Interface
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Language</Label>
                  <p className="text-xs text-muted-foreground">Display language</p>
                </div>
              </div>
              <Select
                value={preferences.language}
                onValueChange={(val) => handleChange('language', val)}
                disabled
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="English" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Time Format</Label>
                  <p className="text-xs text-muted-foreground">Clock display preference</p>
                </div>
              </div>
              <Select
                value={preferences.timeFormat}
                onValueChange={(val) => handleChange('timeFormat', val)}
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
