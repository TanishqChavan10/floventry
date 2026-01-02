import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail } from 'lucide-react';

interface ProfileFormProps {
  formData: {
    firstName: string;
    lastName: string;
  };
  onFormDataChange: (data: { firstName: string; lastName: string }) => void;
}

export function ProfileForm({ formData, onFormDataChange }: ProfileFormProps) {
  const { user } = useUser();

  return (
    <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-8">
          <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
            <AvatarImage src={user?.imageUrl} className="object-cover" />
            <AvatarFallback className="text-2xl bg-muted">{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div>
              <h3 className="text-xl font-bold tracking-tight">{user?.fullName}</h3>
              <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 mb-2">
               <User className="h-4 w-4 text-primary" />
               <h4 className="font-semibold text-sm">Basic Details</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => onFormDataChange({ ...formData, firstName: e.target.value })}
                  className="bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => onFormDataChange({ ...formData, lastName: e.target.value })}
                  className="bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
               <Mail className="h-4 w-4 text-primary" />
               <h4 className="font-semibold text-sm">Contact Info</h4>
            </div>
            <Label htmlFor="email" className="sr-only">Email</Label>
            <Input
              id="email"
              value={user?.primaryEmailAddress?.emailAddress || ''}
              disabled
              className="bg-muted/50 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground px-1">
              Contact support to change your email address.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
