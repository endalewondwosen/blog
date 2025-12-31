import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, BlogPost } from '../types';
import { Users, FileText, Heart, Trash2, Shield, Activity, Search, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalLikes: 0 });
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts'>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [statsData, usersData, postsData] = await Promise.all([
                    api.getAdminStats(),
                    api.getAllUsers(),
                    api.getPosts()
                ]);
                setStats(statsData);
                setUsers(usersData);
                setPosts(postsData);
            } catch (error) {
                console.error(error);
                showToast("Failed to load admin data", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm("Are you sure? This will delete the user AND all their posts. This cannot be undone.")) {
            try {
                await api.deleteUser(userId);
                setUsers(prev => prev.filter(u => u.id !== userId));
                setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
                showToast("User deleted successfully", "success");
            } catch (e) {
                showToast("Failed to delete user", "error");
            }
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await api.deletePost(postId);
                setPosts(prev => prev.filter(p => p.id !== postId));
                setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
                showToast("Post deleted successfully", "success");
            } catch (e) {
                showToast("Failed to delete post", "error");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-600 rounded-xl text-white">
                    <Shield size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500">Manage users, content, and view platform insights.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === 'overview' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <span className="flex items-center gap-2"><Activity size={18} /> Overview</span>
                    {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === 'users' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <span className="flex items-center gap-2"><Users size={18} /> Users</span>
                    {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('posts')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === 'posts' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <span className="flex items-center gap-2"><FileText size={18} /> Content Management</span>
                    {activeTab === 'posts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.totalUsers}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                            <FileText size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Posts</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.totalPosts}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl">
                            <Heart size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Likes</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.totalLikes}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold">Joined</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-gray-200" />
                                                <span className="font-medium text-gray-900">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                user.role === 'admin' 
                                                ? 'bg-purple-100 text-purple-800' 
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(user.joinedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={user.role === 'admin'}
                                                className="text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="px-6 py-4 font-semibold">Title</th>
                                        <th className="px-6 py-4 font-semibold">Author</th>
                                        <th className="px-6 py-4 font-semibold">Likes</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {posts.map(post => (
                                        <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <button onClick={() => navigate(`/post/${post.id}`)} className="text-left font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 block max-w-xs">
                                                    {post.title}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {post.authorName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {post.likes}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                 <button 
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete Post"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;