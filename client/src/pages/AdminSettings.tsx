import { useState } from 'react';
import { useLocation } from 'wouter';
import AdminNav from '../components/AdminNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [location] = useLocation();
  const [settings, setSettings] = useState({
    siteName: 'BLOZHIK',
    siteDescription: 'Modern blogging platform',
    allowRegistration: true,
    requireEmailVerification: false,
    maxPostsPerDay: 10,
    maxCommentsPerPost: 1000,
    enableComments: true,
    enableReactions: true,
    maintenanceMode: false,
  });

  const handleSave = () => {
    // TODO: Save to API
    console.log('Saving settings:', settings);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="flex bg-gray-50 dark:bg-black min-h-screen">
      <AdminNav currentPath={location} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-black dark:text-white">Settings</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400 font-bold">
              Configure global system settings
            </p>
          </div>

          <div className="space-y-6">
            {/* General Settings */}
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white p-6 sketch-shadow">
              <h2 className="text-xl font-black text-black dark:text-white mb-4">General Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="siteName" className="font-bold">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="border-2 border-black dark:border-white font-bold"
                  />
                </div>

                <div>
                  <Label htmlFor="siteDescription" className="font-bold">Site Description</Label>
                  <Input
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                    className="border-2 border-black dark:border-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* User Settings */}
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white p-6 sketch-shadow">
              <h2 className="text-xl font-black text-black dark:text-white mb-4">User Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold">Allow Registration</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow new users to register
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowRegistration}
                    onChange={(e) => setSettings({...settings, allowRegistration: e.target.checked})}
                    className="w-6 h-6 border-2 border-black dark:border-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold">Require Email Verification</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Users must verify email before posting
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
                    className="w-6 h-6 border-2 border-black dark:border-white"
                  />
                </div>
              </div>
            </div>

            {/* Content Settings */}
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white p-6 sketch-shadow">
              <h2 className="text-xl font-black text-black dark:text-white mb-4">Content Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maxPostsPerDay" className="font-bold">Max Posts Per Day</Label>
                  <Input
                    id="maxPostsPerDay"
                    type="number"
                    value={settings.maxPostsPerDay}
                    onChange={(e) => setSettings({...settings, maxPostsPerDay: parseInt(e.target.value)})}
                    className="border-2 border-black dark:border-white font-bold"
                  />
                </div>

                <div>
                  <Label htmlFor="maxCommentsPerPost" className="font-bold">Max Comments Per Post</Label>
                  <Input
                    id="maxCommentsPerPost"
                    type="number"
                    value={settings.maxCommentsPerPost}
                    onChange={(e) => setSettings({...settings, maxCommentsPerPost: parseInt(e.target.value)})}
                    className="border-2 border-black dark:border-white font-bold"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold">Enable Comments</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow users to comment on posts
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableComments}
                    onChange={(e) => setSettings({...settings, enableComments: e.target.checked})}
                    className="w-6 h-6 border-2 border-black dark:border-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold">Enable Reactions</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow users to react to posts and comments
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableReactions}
                    onChange={(e) => setSettings({...settings, enableReactions: e.target.checked})}
                    className="w-6 h-6 border-2 border-black dark:border-white"
                  />
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white p-6 sketch-shadow">
              <h2 className="text-xl font-black text-black dark:text-white mb-4">System Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold text-black dark:text-white">Maintenance Mode</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Disable site for regular users (admins can still access)
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                    className="w-6 h-6 border-2 border-black dark:border-white"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-2 border-black dark:border-white font-bold"
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                className="bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 font-bold sketch-shadow"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
