'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Mail, 
  MoreHorizontal, 
  Shield, 
  Trash2, 
  RefreshCw, 
  Plus,
  Search,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// Mock Data
const MOCK_MEMBERS = [
  { id: 1, name: 'Riya Sharma', email: 'riya@orion.com', role: 'Admin', status: 'Active', joined: 'Oct 12, 2023', avatar: 'RS' },
  { id: 2, name: 'Arjun Singh', email: 'arjun@orion.com', role: 'Manager', status: 'Active', joined: 'Nov 05, 2023', avatar: 'AS' },
  { id: 3, name: 'Priya Patel', email: 'priya@orion.com', role: 'Staff', status: 'Active', joined: 'Jan 15, 2024', avatar: 'PP' },
];

const MOCK_INVITES = [
  { id: 1, email: 'supplier@partners.com', role: 'Supplier', status: 'Pending', sent: '2 days ago' },
  { id: 2, email: 'new.hire@orion.com', role: 'Staff', status: 'Expired', sent: '1 week ago' },
];

export default function TeamManagementPage() {
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [invites, setInvites] = useState(MOCK_INVITES);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Staff');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newInvite = {
      id: Date.now(),
      email: inviteEmail,
      role: inviteRole,
      status: 'Pending',
      sent: 'Just now'
    };
    
    setInvites([newInvite, ...invites]);
    setIsLoading(false);
    setIsInviteOpen(false);
    setInviteEmail('');
    toast.success(`Invitation sent to ${inviteEmail}`);
  };

  const handleResend = (id: number) => {
    toast.success('Invitation resent successfully');
  };

  const handleCancelInvite = (id: number) => {
    setInvites(invites.filter(i => i.id !== id));
    toast.success('Invitation cancelled');
  };

  const handleRemoveMember = (id: number) => {
    setMembers(members.filter(m => m.id !== id));
    toast.success('Team member removed');
  };

  const handleRoleChange = (id: number, newRole: string) => {
    setMembers(members.map(m => m.id === id ? { ...m, role: newRole } : m));
    toast.success('Role updated successfully');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Management</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Manage who can access your company workspace.
            </p>
          </div>
          
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your workspace.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="colleague@company.com" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="Supplier">Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Admins have full access. Managers can manage inventory. Staff has limited access.
                  </p>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Invite'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-slate-500" />
                Pending Invites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{invite.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={invite.status === 'Pending' ? 'secondary' : 'destructive'}
                          className={invite.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : ''}
                        >
                          {invite.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">{invite.sent}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleResend(invite.id)}
                            title="Resend Invite"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancelInvite(invite.id)}
                            title="Cancel Invite"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Active Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              Active Team Members
            </CardTitle>
            <CardDescription>
              Manage roles and access for your current team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search members..."
                  className="pl-9 max-w-sm"
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-medium text-xs">
                          {member.avatar}
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-slate-500">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={member.role} 
                        onValueChange={(val) => handleRoleChange(member.id, val)}
                      >
                        <SelectTrigger className="w-[110px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                          <SelectItem value="Supplier">Supplier</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{member.joined}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {}}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
