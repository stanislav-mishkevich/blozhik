import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import AdminHeader from '../components/AdminHeader';
import AdminNav from '../components/AdminNav';
import { useLocation } from 'wouter';

interface Post {
  id: string;
  title: string;
  author: string;
  authorId: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  status: 'published' | 'draft' | 'scheduled';
  isFeatured: boolean;
}

export default function AdminPosts() {
  const [location] = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filters, setFilters] = useState({
    author: '',
    status: '',
    dateRange: '',
    search: ''
  });
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  // Fetch posts via tRPC
  const postsQuery = trpc.admin.posts.list.useQuery({ limit: 100 });
  const { data: postsData, isLoading, refetch } = postsQuery;

  // Wire posts from backend to local state
  useEffect(() => {
    if (postsData?.posts) {
      setPosts(postsData.posts.map((p: any) => ({
        id: String(p.id),
        title: p.title,
        author: p.userName || p.username || 'unknown',
        authorId: String(p.userId),
        publishedAt: p.createdAt,
        views: Number(p.viewCount || 0),
        likes: Number(p.likeCount || 0),
        comments: Number(p.commentCount || 0),
        status: p.published === 1 ? 'published' : (p.scheduledAt ? 'scheduled' : 'draft'),
        isFeatured: Boolean(p.featured)
      })));
    }
  }, [postsData]);

  const deleteMutation = trpc.admin.posts.delete.useMutation();
  const featureMutation = trpc.admin.posts.feature.useMutation();

  const handleStatusChange = async (postId: string, status: Post['status']) => {
    // TODO: implement status change endpoint on backend and call it here
    console.log('Changing status of post', postId, 'to', status);
    // Placeholder behavior: refetch the list after a potential status change
    await refetch();
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync({ postId: Number(postId) });
      // Обновляем локальное состояние немедленно
      setPosts(posts.filter(p => p.id !== postId));
      await refetch();
      alert('Post deleted successfully!');
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPosts.length} posts? This action cannot be undone.`)) return;
    try {
      await Promise.all(selectedPosts.map(id => deleteMutation.mutateAsync({ postId: Number(id) })));
      // Обновляем локальное состояние немедленно
      setPosts(posts.filter(p => !selectedPosts.includes(p.id)));
      setSelectedPosts([]);
      await refetch();
      alert(`${selectedPosts.length} posts deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete posts:', error);
      alert('Failed to delete some posts. Please try again.');
    }
  };

  const handleFeaturePost = async (postId: string, featured: boolean) => {
    await featureMutation.mutateAsync({ postId: Number(postId), featured });
    await refetch();
  };

  const getStatusColor = (status: Post['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-2 border-black';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-2 border-black';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-2 border-black';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-2 border-black';
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const filteredPosts = posts.filter(post => {
    if (filters.author && !post.author.toLowerCase().includes(filters.author.toLowerCase())) return false;
    if (filters.status && post.status !== filters.status) return false;
    if (filters.search && !post.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminHeader title="Posts Management" backUrl="/admin">
      <div className="flex bg-slate-50 dark:bg-slate-900">
        <AdminNav currentPath={location} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search by Title
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full rounded-lg border-2 border-black dark:border-white dark:bg-gray-900 px-3 py-2"
              placeholder="Search posts..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Author
            </label>
            <input
              type="text"
              value={filters.author}
              onChange={(e) => setFilters({...filters, author: e.target.value})}
              className="w-full rounded-lg border-2 border-black dark:border-white dark:bg-gray-900 px-3 py-2"
              placeholder="Filter by author..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full rounded-lg border-2 border-black dark:border-white dark:bg-gray-900 px-3 py-2 font-bold"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ author: '', status: '', dateRange: '', search: '' })}
              className="w-full bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg border-2 border-black"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border-2 border-black rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-black dark:text-white font-bold">
              {selectedPosts.length} post{selectedPosts.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedPosts([])}
                className="bg-white hover:bg-gray-100 text-black px-3 py-1 rounded-lg border-2 border-black text-sm"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded-lg border-2 border-black text-sm"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white dark:bg-gray-800 border-2 border-black sketch-shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPosts(filteredPosts.map(p => p.id));
                      } else {
                        setSelectedPosts([]);
                      }
                    }}
                    className="rounded border-2 border-black dark:border-gray-600 dark:bg-gray-700"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPosts.map((post) => (
                <tr key={post.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPosts([...selectedPosts, post.id]);
                        } else {
                          setSelectedPosts(selectedPosts.filter(id => id !== post.id));
                        }
                      }}
                      className="rounded border-2 border-black dark:border-gray-600 dark:bg-gray-700"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                          {post.title}
                        </div>
                        {post.isFeatured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg border-2 border-black text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {post.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>{post.views} views</div>
                    <div>{post.likes} likes, {post.comments} comments</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(post.publishedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleFeaturePost(post.id, !post.isFeatured)}
                      className={`text-xs px-2 py-1 rounded-lg border-2 border-black ${
                        post.isFeatured
                          ? 'bg-black hover:bg-gray-800 text-white'
                          : 'bg-white hover:bg-gray-100 text-black'
                      }`}
                    >
                      {post.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No posts found</p>
          </div>
        )}
      </div>
      </div>
        </main>
      </div>
    </AdminHeader>
  );
}