import { Header } from '@/components/Header';
import { rustApi } from '@/lib/rustBack';
import { useAuthState } from '@/hooks/useAuthState';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

export default function Drafts() {
  const { user } = useAuthState();
  const [, setLocation] = useLocation();
  const { data: drafts, isLoading } = rustApi.post.getDrafts.useQuery(undefined, { enabled: !!user });
  const utils = rustApi.useUtils();
  
  const deletePostMutation = rustApi.post.delete.useMutation({
    onSuccess: () => {
      toast.success('Draft deleted');
      utils.post.getDrafts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete draft');
    },
  });

  const handleDelete = (postId: number, title: string) => {
    if (confirm(`Delete draft "${title || 'Untitled'}"?`)) {
      deletePostMutation.mutate({ postId });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
          <h1 className="text-2xl font-bold mb-4">Your Drafts</h1>
          {isLoading && <div>Loading...</div>}
          {drafts && drafts.length === 0 && <div className="text-gray-600">No drafts yet.</div>}
          <div className="space-y-3">
            {drafts?.map((d: any) => (
              <div key={d.id} className="p-3 border-2 border-gray-200 rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex-1 cursor-pointer" onClick={() => setLocation(`/posts/${d.id}/edit`)}>
                  <div className="font-semibold">{d.title || 'Untitled'}</div>
                  <div className="text-sm text-gray-500">Updated: {new Date(d.updatedAt).toLocaleString()}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-2 border-black">
                    <DropdownMenuItem 
                      onClick={() => setLocation(`/posts/${d.id}/edit`)}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(d.id, d.title)}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
