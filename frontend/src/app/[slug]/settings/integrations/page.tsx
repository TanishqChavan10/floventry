'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function IntegrationsPage() {
  const { getToken } = useAuth();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const json = await res.json();
      setIntegrations(json);
    } catch (error) {
      console.error('Failed to fetch integrations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const toggleIntegration = async (id: string, isEnabled: boolean) => {
    try {
      const token = await getToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/${id}/toggle`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isEnabled }),
        },
      );
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isEnabled } : i)),
      );
      toast.success(`Integration ${isEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update integration');
    }
  };

  const addIntegration = async (name: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/integrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, isEnabled: false }),
      });
      const newIntegration = await res.json();
      setIntegrations((prev) => [...prev, newIntegration]);
      toast.success('Integration added');
    } catch (error) {
      toast.error('Failed to add integration');
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
        <Button onClick={() => addIntegration('New Integration')}>
          Add Integration
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div>Loading...</div>
        ) : (
          integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {integration.name}
                </CardTitle>
                <Switch
                  checked={integration.isEnabled}
                  onCheckedChange={(checked) =>
                    toggleIntegration(integration.id, checked)
                  }
                />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect your {integration.name} account to sync data.
                </CardDescription>
                <div className="mt-4 space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="****************"
                    disabled={!integration.isEnabled}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!integration.isEnabled}
                  >
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
