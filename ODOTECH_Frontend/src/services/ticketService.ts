import type {
    Ticket,
    TicketCategory,
    TicketComment,
    TicketStatusHistory,
    TicketFilters,
    TicketStats,
    CreateTicketData,
    UpdateTicketData,
    CreateCommentData,
} from '../interface/ticket.interface';

const getApiUrl = () => import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || 'http://localhost:5000';
const API_BASE_URL = getApiUrl();

// Helper function for fetch requests
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include', // Include cookies
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

// Tickets API
export const ticketService = {
    // Get all tickets with filters
    async getAllTickets(filters?: TicketFilters): Promise<Ticket[]> {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, String(value));
                }
            });
        }
        const queryString = params.toString();
        return fetchAPI<Ticket[]>(`/api/tickets${queryString ? `?${queryString}` : ''}`);
    },

    // Get ticket statistics
    async getTicketStats(type?: 'customer' | 'internal'): Promise<TicketStats> {
        const params = type ? `?type=${type}` : '';
        return fetchAPI<TicketStats>(`/api/tickets/stats${params}`);
    },

    // Get current user's assigned tickets
    async getMyTickets(): Promise<Ticket[]> {
        return fetchAPI<Ticket[]>('/api/tickets/my-tickets');
    },

    // Get ticket by ID
    async getTicketById(id: number): Promise<Ticket> {
        return fetchAPI<Ticket>(`/api/tickets/${id}`);
    },

    // Create new ticket
    async createTicket(data: CreateTicketData): Promise<Ticket> {
        return fetchAPI<Ticket>('/api/tickets', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update ticket
    async updateTicket(id: number, data: UpdateTicketData): Promise<Ticket> {
        return fetchAPI<Ticket>(`/api/tickets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Delete ticket
    async deleteTicket(id: number): Promise<void> {
        await fetchAPI<void>(`/api/tickets/${id}`, {
            method: 'DELETE',
        });
    },

    // Assign ticket to user
    async assignTicket(id: number, assignedToId: number): Promise<Ticket> {
        return fetchAPI<Ticket>(`/api/tickets/${id}/assign`, {
            method: 'POST',
            body: JSON.stringify({ assigned_to_id: assignedToId }),
        });
    },

    // Update ticket status
    async updateTicketStatus(id: number, status: string): Promise<Ticket> {
        return fetchAPI<Ticket>(`/api/tickets/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status }),
        });
    },

    // Get ticket comments
    async getTicketComments(id: number): Promise<TicketComment[]> {
        return fetchAPI<TicketComment[]>(`/api/tickets/${id}/comments`);
    },

    // Add comment to ticket
    async addComment(id: number, data: CreateCommentData): Promise<TicketComment> {
        return fetchAPI<TicketComment>(`/api/tickets/${id}/comments`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update comment
    async updateComment(ticketId: number, commentId: number, comment: string): Promise<TicketComment> {
        return fetchAPI<TicketComment>(`/api/tickets/${ticketId}/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ comment }),
        });
    },

    // Delete comment
    async deleteComment(ticketId: number, commentId: number): Promise<void> {
        await fetchAPI<void>(`/api/tickets/${ticketId}/comments/${commentId}`, {
            method: 'DELETE',
        });
    },

    // Get ticket history
    async getTicketHistory(id: number): Promise<TicketStatusHistory[]> {
        return fetchAPI<TicketStatusHistory[]>(`/api/tickets/${id}/history`);
    },
};

// Categories API
export const categoryService = {
    // Get all categories
    async getAllCategories(type?: 'customer' | 'internal'): Promise<TicketCategory[]> {
        const params = type ? `?type=${type}` : '';
        return fetchAPI<TicketCategory[]>(`/api/ticket-categories${params}`);
    },

    // Get category by ID
    async getCategoryById(id: number): Promise<TicketCategory> {
        return fetchAPI<TicketCategory>(`/api/ticket-categories/${id}`);
    },

    // Create category (admin only)
    async createCategory(data: Partial<TicketCategory>): Promise<TicketCategory> {
        return fetchAPI<TicketCategory>('/api/ticket-categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update category (admin only)
    async updateCategory(id: number, data: Partial<TicketCategory>): Promise<TicketCategory> {
        return fetchAPI<TicketCategory>(`/api/ticket-categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Delete category (admin only)
    async deleteCategory(id: number): Promise<void> {
        await fetchAPI<void>(`/api/ticket-categories/${id}`, {
            method: 'DELETE',
        });
    },
};
