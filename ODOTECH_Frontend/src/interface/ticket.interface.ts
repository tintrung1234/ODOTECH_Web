// Ticket Management Interfaces

export interface Ticket {
    id: number;
    ticket_number: string;
    type: 'customer' | 'internal';
    category_id: number | null;
    category_name: string | null;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'new' | 'in_progress' | 'resolved' | 'closed';
    created_by_id: number;
    created_by_type: 'employee' | 'customer';
    created_by_name: string | null;
    assigned_to_id: number | null;
    assigned_to_name: string | null;
    customer_id: number | null;
    customer_name: string | null;
    related_project_id: number | null;
    related_project_name: string | null;
    metadata: Record<string, any>;
    resolved_at: string | null;
    closed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface TicketCategory {
    id: number;
    name: string;
    type: 'customer' | 'internal';
    description: string;
    color: string;
    icon: string;
    is_active: boolean;
    created_at: string;
}

export interface TicketComment {
    id: number;
    ticket_id: number;
    user_id: number;
    user_name: string | null;
    comment: string;
    is_internal: boolean;
    created_at: string;
    updated_at: string;
}

export interface TicketStatusHistory {
    id: number;
    ticket_id: number;
    changed_by_id: number;
    changed_by_name: string | null;
    field_name: string;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
}

export interface TicketFilters {
    type?: 'customer' | 'internal';
    status?: 'new' | 'in_progress' | 'resolved' | 'closed';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category_id?: number;
    assigned_to_id?: number;
    customer_id?: number;
    search?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}

export interface TicketStats {
    total: number;
    new_count: number;
    in_progress_count: number;
    resolved_count: number;
    closed_count: number;
    urgent_count: number;
    high_count: number;
    avg_resolution_hours: number | null;
}

export interface CreateTicketData {
    type: 'customer' | 'internal';
    category_id?: number;
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assigned_to_id?: number;
    customer_id?: number;
    related_project_id?: number;
    metadata?: Record<string, any>;
}

export interface UpdateTicketData {
    category_id?: number;
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'new' | 'in_progress' | 'resolved' | 'closed';
    assigned_to_id?: number;
    metadata?: Record<string, any>;
}

export interface CreateCommentData {
    comment: string;
    is_internal?: boolean;
}
