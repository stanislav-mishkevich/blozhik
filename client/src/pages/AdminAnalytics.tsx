import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import AdminHeader from "@/components/AdminHeader";
import AdminNav from "@/components/AdminNav";
import { useLocation } from "wouter";
import { Users, FileText, MessageSquare, Heart, TrendingUp, TrendingDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function AdminAnalytics() {
  const [location] = useLocation();
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");
  const days = parseInt(timeRange);

  const { data: overview } = trpc.admin.statistics.overview.useQuery();
  const { data: users } = trpc.admin.statistics.users.useQuery({ days });
  const { data: content } = trpc.admin.statistics.content.useQuery({ days });
  const { data: engagement } = trpc.admin.statistics.engagement.useQuery({ days });

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percent: 0, isIncrease: true };
    const percent = ((current - previous) / previous) * 100;
    return { percent: Math.abs(Math.round(percent)), isIncrease: percent >= 0 };
  };

  return (
    <AdminHeader title="Analytics" backUrl="/admin">
      <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-600">Detailed platform analytics and insights</p>
        </div>
        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <SelectTrigger className="w-[180px] border-2 border-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="h-8 w-8 text-black dark:text-white" />}
          title="Total Users"
          value={overview?.totalUsers || 0}
          subtitle={`${users?.total || 0} users`}
        />
        <StatCard
          icon={<FileText className="h-8 w-8 text-black dark:text-white" />}
          title="Total Posts"
          value={overview?.totalPosts || 0}
          subtitle="All posts"
        />
        <StatCard
          icon={<MessageSquare className="h-8 w-8 text-black dark:text-white" />}
          title="Total Comments"
          value={overview?.totalComments || 0}
          subtitle="All comments"
        />
        <StatCard
          icon={<Heart className="h-8 w-8 text-pink-500" />}
          title="Total Likes"
          value={0}
          subtitle="Coming soon"
        />
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
          <h3 className="text-xl font-bold mb-4">User Metrics</h3>
          <div className="space-y-4">
            <MetricRow
              label="Total Users"
              value={users?.total || 0}
              total={users?.total || 0}
            />
            <p className="text-sm text-gray-500">Detailed user metrics coming soon</p>
          </div>
        </div>

        <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
          <h3 className="text-xl font-bold mb-4">Content Metrics</h3>
          <div className="space-y-4">
            <MetricRow
              label="Total Posts"
              value={overview?.totalPosts || 0}
              total={overview?.totalPosts || 0}
            />
            <MetricRow
              label="Total Comments"
              value={overview?.totalComments || 0}
              total={overview?.totalComments || 0}
            />
            <p className="text-sm text-gray-500">Detailed content metrics coming soon</p>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow mb-6">
        <h3 className="text-xl font-bold mb-4">Engagement Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Likes per Post</p>
            <p className="text-3xl font-bold">{engagement?.avgLikesPerPost?.toFixed(1) || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Comments per Post</p>
            <p className="text-3xl font-bold">{engagement?.avgCommentsPerPost?.toFixed(1) || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Engagement</p>
            <p className="text-3xl font-bold">{(overview?.totalComments || 0)}</p>
          </div>
        </div>
      </div>

      {/* Top Content */}
      <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
        <h3 className="text-xl font-bold mb-4">Top Performing Content</h3>
        <p className="text-gray-500 text-center py-4">Top posts analytics coming soon</p>
      </div>
      </div>
    </AdminHeader>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  change,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  change?: { percent: number; isIncrease: boolean };
}) {
  return (
    <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
      <div className="flex items-center justify-between mb-4">
        {icon}
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium text-black dark:text-white`}>
            {change.isIncrease ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {change.percent}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold mb-1">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function MetricRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-gray-600">
          {value} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-black dark:bg-white h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
