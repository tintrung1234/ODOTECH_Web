/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Ticket, TicketComment, TicketStatusHistory } from '../interface/ticket.interface';
import { ticketService } from '../services/ticketService';
import TicketPriorityBadge from '../components/tickets/TicketPriorityBadge';
import TicketStatusBadge from '../components/tickets/TicketStatusBadge';
import { getStatusLabel, getTimeAgo, getTypeLabel, isValidStatusTransition } from '../utils/ticketUtils';
import { getTokenUser, normalizeRole } from '../utils/auth';

type AccountLite = { id: number; name?: string; username?: string };

const TicketDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const ticketId = useMemo(() => Number(id), [id]);

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [comments, setComments] = useState<TicketComment[]>([]);
    const [history, setHistory] = useState<TicketStatusHistory[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [commentDraft, setCommentDraft] = useState('');
    const [commentInternal, setCommentInternal] = useState(false);
    const [commentBusy, setCommentBusy] = useState(false);

    const [accounts, setAccounts] = useState<AccountLite[]>([]);
    const [assignBusy, setAssignBusy] = useState(false);
    const [statusBusy, setStatusBusy] = useState(false);

    const apiBaseUrl = useMemo(() => {
        const envUrl = import.meta.env.VITE_API_URL;
        return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
    }, []);

    const loadAccounts = async () => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/accounts?limit=1000&offset=0`, { credentials: 'include' });
            if (!res.ok) return;
            const json = await res.json() as any;
            const items: any[] = Array.isArray(json) ? json : (json.items ?? []);
            setAccounts(items.map((x) => ({ id: Number(x.id), name: x.name, username: x.username })));
        } catch {
            // ignore
        }
    };

    const load = async () => {
        if (!ticketId || Number.isNaN(ticketId)) {
            setError('ID ticket không hợp lệ');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [t, c, h] = await Promise.all([
                ticketService.getTicketById(ticketId),
                ticketService.getTicketComments(ticketId),
                ticketService.getTicketHistory(ticketId),
            ]);

            setTicket(t);
            setComments(c);
            setHistory(h);

            void loadAccounts();
        } catch (err: any) {
            setError(err?.message || 'Không thể tải chi tiết ticket');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId]);

    const canManage = async (): Promise<boolean> => {
        const user = await getTokenUser();
        const role = normalizeRole(user?.role);
        return role === 'admin' || role === 'sales_manager' || role === 'head_sales' || role === 'dev_manager' || role === 'head_tech' || role === 'support';
    };

    const handleAssign = async (assigneeId: number) => {
        if (!ticket) return;
        setAssignBusy(true);
        try {
            const ok = await canManage();
            if (!ok) throw new Error('Bạn không có quyền giao ticket');

            const updated = await ticketService.assignTicket(ticket.id, assigneeId);
            setTicket(updated);
        } catch (err: any) {
            alert(err?.message || 'Không thể giao ticket');
        } finally {
            setAssignBusy(false);
        }
    };

    const handleStatusChange = async (nextStatus: Ticket['status']) => {
        if (!ticket) return;
        if (!isValidStatusTransition(ticket.status, nextStatus)) {
            alert(`Không thể chuyển trạng thái từ ${getStatusLabel(ticket.status)} sang ${getStatusLabel(nextStatus)}`);
            return;
        }

        setStatusBusy(true);
        try {
            const updated = await ticketService.updateTicketStatus(ticket.id, nextStatus);
            setTicket(updated);
            const h = await ticketService.getTicketHistory(ticket.id);
            setHistory(h);
        } catch (err: any) {
            alert(err?.message || 'Không thể cập nhật trạng thái');
        } finally {
            setStatusBusy(false);
        }
    };

    const handleAddComment = async () => {
        if (!ticket) return;
        const text = commentDraft.trim();
        if (!text) return;

        setCommentBusy(true);
        try {
            await ticketService.addComment(ticket.id, { comment: text, is_internal: commentInternal });
            setCommentDraft('');
            const c = await ticketService.getTicketComments(ticket.id);
            setComments(c);
        } catch (err: any) {
            alert(err?.message || 'Không thể gửi bình luận');
        } finally {
            setCommentBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center items-center h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20">
                                <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Có lỗi xảy ra</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
                            <div className="mt-6 flex gap-3 justify-center">
                                <button
                                    onClick={() => navigate('/tickets')}
                                    className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                                >
                                    Quay lại
                                </button>
                                <button
                                    onClick={load}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Thử lại
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Không tìm thấy ticket</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Ticket này có thể đã bị xóa hoặc không tồn tại.</p>
                        <button
                            onClick={() => navigate('/tickets')}
                            className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Get initials for avatar
    const getInitials = (name?: string | null, username?: string | null) => {
        const displayName = name || username || '?';
        return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto p-6">
                {/* Breadcrumb */}
                <nav className="mb-6">
                    <ol className="flex items-center space-x-2 text-sm">
                        <li>
                            <button
                                onClick={() => navigate('/tickets')}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                                Tickets
                            </button>
                        </li>
                        <li className="text-gray-400 dark:text-gray-600">/</li>
                        <li className="text-gray-900 dark:text-white font-medium">{ticket.ticket_number}</li>
                    </ol>
                </nav>

                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-sm font-mono px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold">
                                    {ticket.ticket_number}
                                </span>
                                <span
                                    className="text-xs px-3 py-1 rounded-full font-medium"
                                    style={{
                                        backgroundColor: ticket.type === 'customer' ? '#3B82F615' : '#8B5CF615',
                                        color: ticket.type === 'customer' ? '#3B82F6' : '#8B5CF6',
                                        border: `1px solid ${ticket.type === 'customer' ? '#3B82F640' : '#8B5CF640'}`,
                                    }}
                                >
                                    {getTypeLabel(ticket.type)}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{ticket.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Tạo bởi {ticket.created_by_name || `User #${ticket.created_by_id}`}</span>
                                </div>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{getTimeAgo(ticket.created_at)}</span>
                                </div>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Cập nhật {getTimeAgo(ticket.updated_at)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <TicketStatusBadge status={ticket.status} />
                            <TicketPriorityBadge priority={ticket.priority} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Mô tả
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>

                            {(ticket.category_name || ticket.customer_name || ticket.related_project_name) && (
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-750">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            Danh mục
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{ticket.category_name || '-'}</div>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-750">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Khách hàng
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{ticket.customer_name || '-'}</div>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-750">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                            Dự án
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{ticket.related_project_name || '-'}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Comments */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Bình luận
                                <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
                                    {comments.length} bình luận
                                </span>
                            </h2>

                            <div className="space-y-4 mb-6">
                                {comments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Chưa có bình luận nào</p>
                                    </div>
                                ) : (
                                    comments.map((c) => (
                                        <div key={c.id} className="flex gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                                    {getInitials(c.user_name, `User${c.user_id}`)}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                            {c.user_name || `User #${c.user_id}`}
                                                        </span>
                                                        {c.is_internal && (
                                                            <span className="px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs font-medium">
                                                                Nội bộ
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{getTimeAgo(c.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{c.comment}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Comment */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <textarea
                                    value={commentDraft}
                                    onChange={(e) => setCommentDraft(e.target.value)}
                                    rows={4}
                                    placeholder="Viết bình luận của bạn..."
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                                />
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={commentInternal}
                                            onChange={(e) => setCommentInternal(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <span className="font-medium">Bình luận nội bộ</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddComment}
                                        disabled={commentBusy || !commentDraft.trim()}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                                    >
                                        {commentBusy ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Đang gửi...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Gửi bình luận
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Actions */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Thao tác
                            </h2>

                            <div className="space-y-5">
                                {/* Assign */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Người phụ trách
                                    </label>
                                    <select
                                        value={ticket.assigned_to_id || ''}
                                        disabled={assignBusy || accounts.length === 0}
                                        onChange={(e) => {
                                            const v = e.target.value ? Number(e.target.value) : null;
                                            if (v) void handleAssign(v);
                                        }}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                    >
                                        <option value="">-- Chọn người phụ trách --</option>
                                        {accounts.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name || a.username || `#${a.id}`}
                                            </option>
                                        ))}
                                    </select>
                                    {accounts.length === 0 && (
                                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Không tải được danh sách nhân sự.</p>
                                    )}
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Thay đổi trạng thái
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['new', 'in_progress', 'resolved', 'closed'] as Ticket['status'][]).map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                disabled={statusBusy || s === ticket.status}
                                                onClick={() => void handleStatusChange(s)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${s === ticket.status
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                                                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-650'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {getStatusLabel(s)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* History */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Lịch sử thay đổi
                            </h2>
                            {history.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Chưa có lịch sử thay đổi</p>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((h, idx) => (
                                        <div key={h.id} className="relative">
                                            {idx !== history.length - 1 && (
                                                <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                            )}
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 w-4 h-4 mt-1 rounded-full bg-blue-600 ring-4 ring-white dark:ring-gray-800"></div>
                                                <div className="flex-1 pb-4">
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                        {h.changed_by_name || `User #${h.changed_by_id}`} • {getTimeAgo(h.created_at)}
                                                    </div>
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        <span className="font-medium">{h.field_name}</span>
                                                        <div className="mt-1 flex items-center gap-2 text-xs">
                                                            <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                                                                {String(h.old_value ?? '-')}
                                                            </span>
                                                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                            <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                                                                {String(h.new_value ?? '-')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
