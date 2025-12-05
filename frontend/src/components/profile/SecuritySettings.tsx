'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function SecuritySettings() {
  const handlePasswordReset = () => {
    // In a real app with Clerk, you might redirect to Clerk's user profile or trigger a reset email
    toast.info('Redirecting to password reset...');
    // window.location.href = '/user-profile/security'; // Example if using Clerk's hosted pages
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Manage your account security settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Password</Label>
            <p className="text-sm text-muted-foreground">
              Change your password regularly to keep your account secure.
            </p>
          </div>
          <Button variant="outline" onClick={handlePasswordReset}>
            Change Password
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account.
            </p>
          </div>
          <Switch disabled checked={false} />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Active Sessions</Label>
            <p className="text-sm text-muted-foreground">
              Manage devices where you are currently logged in.
            </p>
          </div>
          <Button variant="outline">Manage Devices</Button>
        </div>
      </CardContent>
    </Card>
  );
}
