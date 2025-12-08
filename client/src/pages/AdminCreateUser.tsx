import { useState } from "react";
import { useLocation } from "wouter";
import AdminHeader from "@/components/AdminHeader";
import AdminNav from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuthState } from "@/hooks/useAuthState";
import { toast } from "sonner";
import { UserPlus, Shield, Star, Crown, User as UserIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminCreateUser() {
  const { user } = useAuthState();
  const [location, setLocation] = useLocation();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<string>("user");

  const createUserMutation = trpc.admin.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully!");
      setLocation("/admin/users");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("Username, email and password are required");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    createUserMutation.mutate({
      username,
      email,
      password,
      name: name || undefined,
      bio: bio || undefined,
      role: role as any,
    });
  };

  const isGod = user?.role === 'god';
  const isSuperAdmin = user?.role === 'superadmin' || isGod;

  if (!isSuperAdmin) {
    return (
      <AdminHeader title="Access Denied">
        <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen">
          <AdminNav currentPath={location} />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only super admins and god can create users.</p>
            </div>
          </main>
        </div>
      </AdminHeader>
    );
  }

  return (
    <AdminHeader title="Create User" backUrl="/admin">
      <div className="flex bg-slate-50 dark:bg-slate-900">
        <AdminNav currentPath={location} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 border-2 border-black rounded-lg p-6 md:p-8 sketch-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white dark:bg-gray-900 border-2 border-black rounded-lg flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-black dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create New User</h1>
              <p className="text-gray-600 dark:text-gray-400">Add a new user to the platform</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border-2 border-black"
                required
                minLength={3}
                maxLength={30}
              />
              <p className="text-sm text-gray-500">3-30 characters, lowercase letters, numbers, underscores</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 border-black"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-2 border-black"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-sm text-gray-500">Minimum 8 characters. Password will be encrypted and cannot be viewed by anyone.</p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Display Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Full name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-2 border-black"
                maxLength={100}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                placeholder="User bio..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="border-2 border-black"
                maxLength={500}
                rows={3}
              />
              <p className="text-sm text-gray-500">{bio.length}/500 characters</p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="border-2 border-black">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  {isSuperAdmin && (
                    <SelectItem value="admin">Admin</SelectItem>
                  )}
                  {isGod && (
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  )}
                  {isGod && (
                    <SelectItem value="god">God (Full Access)</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                <p className="font-semibold mb-1">Role Permissions:</p>
                {role === 'user' && <p className="text-gray-600 dark:text-gray-400">• Regular user with basic permissions</p>}
                {role === 'moderator' && (
                  <div className="text-gray-600 dark:text-gray-400">
                    <p>• View and manage reports</p>
                    <p>• Delete posts and comments</p>
                  </div>
                )}
                {role === 'admin' && (
                  <div className="text-gray-600 dark:text-gray-400">
                    <p>• All moderator permissions</p>
                    <p>• Manage users (ban, roles for user/moderator)</p>
                    <p>• View statistics and analytics</p>
                    <p>• Create posts as admin</p>
                  </div>
                )}
                {role === 'superadmin' && (
                  <div className="text-gray-600 dark:text-gray-400">
                    <p>• All admin permissions</p>
                    <p>• Create users</p>
                    <p>• Assign admin role</p>
                    <p>• View audit logs</p>
                  </div>
                )}
                {role === 'god' && (
                  <div className="text-gray-600 dark:text-gray-400">
                    <p>• Full system access</p>
                    <p>• Assign any role including superadmin</p>
                    <p>• System settings</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t-2 border-black dark:border-white">
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
                className="border-2 border-black sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                style={{ backgroundColor: "var(--sketch-green)", color: "white" }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
              <Button
                type="button"
                onClick={() => setLocation("/admin/users")}
                variant="outline"
                className="border-2 border-black"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
          </div>
        </main>
      </div>
    </AdminHeader>
  );
}
