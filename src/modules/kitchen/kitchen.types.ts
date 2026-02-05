export type Channel = 'web' | 'tablet' | 'phone';
export type Fulfillment = 'pickup' | 'delivery';
export type Status =
  | 'queued'
  | 'in_prep'
  | 'ready_waiting_arrival'
  | 'ready_for_handoff'
  | 'on_hold'
  | 'out_for_delivery'
  | 'delivered'
  | 'served'
  | 'canceled'
  | 'failed_payment';

export type ArrivalStatus = 'unknown' | 'waiting' | 'arrived' | 'not_required';

export interface OrderItem {
  name: string;
  qty: number;
  modifiers?: string[];
  allergies?: string[];
  station?: string;
  notes?: string;
}

export interface AuditEntry {
  ts: string;
  actor: string;
  action: string;
  details?: Record<string, unknown>;
}

export interface Order {
  id: string;
  channel: Channel;
  fulfillment: Fulfillment;
  source_label: string;
  status: Status;
  arrival_status: ArrivalStatus;
  pickup_code?: string;
  paid_at: string;
  created_at: string;
  started_at?: string;
  ready_at?: string;
  served_at?: string;
  delivered_at?: string;
  prep_estimate_minutes?: number;
  elapsed_seconds?: number;
  late_flag?: boolean;
  priority_flag?: boolean;
  items: OrderItem[];
  audit: AuditEntry[];
}
