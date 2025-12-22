import { useState } from 'react';
import { rustApi } from '../lib/rustBack';
import AdminHeader from '../components/AdminHeader';
import AdminNav from '../components/AdminNav';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, Flag } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminComments() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, refetch } = rustApi.admin.comments.list.useQuery({ 
    limit: 100, 
    search: searchQuery || undefined 
  });
  
  const deleteMutation = rustApi.admin.comments.delete.useMutation({
    onSuccess: () => {
      toast.success('Comment deleted');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this comment? This action is permanent.')) return;
    deleteMutation.mutate({ commentId: id });
  };

  const comments = data?.comments || [];

  return (
    <AdminHeader title="Comments" backUrl="/admin">
      <div className="flex bg-slate-50 dark:bg-slate-900">
        <AdminNav currentPath={location} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <p className="text-slate-600 dark:text-slate-400 mb-4">Manage comments across the platform</p>
              
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search comments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-2 border-black dark:border-white rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-black dark:border-white sketch-shadow">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700 border-b-2 border-black dark:border-white">                   <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Author</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Content</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Post</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Reports</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {comments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No comments found
                        </td>
                      </tr>
                    ) : (
                      comments.map((c: any) => {
                        const author = c.author || {};
                        const post = c.post || {};
                        const reportsCount = c.reportsCount || 0;
                        
                        return (
                          <tr key={c.comment.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setLocation(`/users/${author.username}`)}
                                className="text-sm font-medium text-black dark:text-white hover:underline"
                              >
                                {author.name || author.username || 'Unknown'}
                              </button>
                              <div className="text-xs text-slate-500">@{author.username}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-slate-900 dark:text-slate-100 line-clamp-2 max-w-md">
                                {c.comment.content}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setLocation(`/posts/${post.id}`)}
                                className="text-sm text-black dark:text-white hover:underline line-clamp-1 max-w-xs"
                              >
                                {post.title || 'Untitled'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {new Date(c.comment.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              {reportsCount > 0 ? (
                                <Badge variant="destructive" className="gap-1">
                                  <Flag className="h-3 w-3" />
                                  {reportsCount}
                                </Badge>
                              ) : (
                                <span className="text-sm text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(c.comment.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminHeader>
  );
}
