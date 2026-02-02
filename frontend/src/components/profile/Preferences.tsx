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
import {
  Bell,
  Mail,
  Settings,
  Package,
  AlertTriangle,
  FileText,
  Globe,
  Clock,
  Smartphone,
} from 'lucide-react';

interface PreferencesProps {
  preferences: {
    emailNotifications: boolean;
    inAppNotifications: boolean;
    lowStockAlerts: boolean;
    expiryAlerts: boolean;
    poUpdates: boolean;
    marketingEmails: boolean;
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
    <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Notifications Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <Bell className="h-4 w-4" /> Notifications
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium cursor-pointer">In-app Notifications</Label>
                  <p className="text-xs text-muted-foreground">Alerts within the application</p>
                </div>
              </div>
              <Switch
                checked={preferences.inAppNotifications}
                onCheckedChange={() => handleToggle('inAppNotifications')}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium cursor-pointer">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive emails about activity</p>
                </div>
              </div>
              <Switch
                checked={preferences.emailNotifications}
                onCheckedChange={() => handleToggle('emailNotifications')}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium cursor-pointer">Low-stock Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified when stock runs low</p>
                </div>
              </div>
              <Switch
                checked={preferences.lowStockAlerts}
                onCheckedChange={() => handleToggle('lowStockAlerts')}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium cursor-pointer">Expiry Alerts</Label>
                  <p className="text-xs text-muted-foreground">Notifications for expiring items</p>
                </div>
              </div>
              <Switch
                checked={preferences.expiryAlerts}
                onCheckedChange={() => handleToggle('expiryAlerts')}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium cursor-pointer">PO Updates</Label>
                  <p className="text-xs text-muted-foreground">Purchase order status changes</p>
                </div>
              </div>
              <Switch
                checked={preferences.poUpdates}
                onCheckedChange={() => handleToggle('poUpdates')}
              />
            </div>
          </div>
        </div>

        {/* UX Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
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
