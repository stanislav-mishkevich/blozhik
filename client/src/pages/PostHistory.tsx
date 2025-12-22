import { Header } from '@/components/Header';
import { rustApi } from '@/lib/rustBack';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';
import { useState } from 'react';

export default function PostHistory() {
  const params = useParams();
  const postId = parseInt(params.id || '0');
  const { user } = useAuthState();
  const [, setLocation] = useLocation();

    const { data: postData } = rustApi.post.getById.useQuery({ postId }, { enabled: !!postId });
    const { data: versions } = rustApi.post.getVersions.useQuery({ postId }, { enabled: !!postId });
    const revertMutation = rustApi.post.revertToVersion.useMutation({ onSuccess: () => {
    toast.success('Post reverted to selected version');
    setLocation(`/posts/${postId}`);
  }});
  const [selectedDiff, setSelectedDiff] = useState<string | null>(null);
    const utils = rustApi.useUtils();

  const showDiff = async (versionId?: number) => {
    try {
      const res = await utils.client.post.getDiff.query({ postId, versionId });
      setSelectedDiff(res.diff || null);
    } catch (err) { toast.error('Failed to fetch diff'); }
  };

  if (!postData) return null;

  const isOwner = user?.id === postData.post.userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
          <h1 className="text-2xl font-bold mb-4">Post History</h1>
          <h2 className="text-lg font-semibold mb-4">{postData.post.title}</h2>
          {versions && versions.length === 0 && <div className="text-gray-600">No versions available</div>}
          <div className="space-y-3">
            {versions?.map((v: any) => (
              <div key={v.id} className="p-3 border-2 border-gray-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{v.title || 'Untitled'}</div>
                    <div className="text-sm text-gray-600">{new Date(v.createdAt).toLocaleString()}</div>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button onClick={() => revertMutation.mutate({ postId, versionId: v.id })} variant="outline" className="border-2 border-black">Revert</Button>
                      <Button onClick={() => showDiff(v.id)} variant="ghost" className="border-2 border-black">Show diff</Button>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{(v.content || '').substring(0, 300)}</div>
              </div>
            ))}
              {selectedDiff && (
                <div className="mt-4 p-4 border-2 border-black rounded bg-white">
                  <h3 className="font-semibold mb-2">Diff (Unified Patch)</h3>
                  <pre className="whitespace-pre-wrap text-sm">{selectedDiff}</pre>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
