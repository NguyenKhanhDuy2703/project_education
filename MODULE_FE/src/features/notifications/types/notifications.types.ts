export type NotificationType =
  | 'UPGRADE_REQUEST_CREATED'
  | 'PAYMENT_SUBMITTED'
  | 'UPGRADE_APPROVED'
  | 'UPGRADE_REJECTED'
  | 'MEMBERSHIP_EXPIRING_SOON'
  | 'MEMBERSHIP_EXPIRED'
  | 'CONTENT_REVIEW_APPROVED'
  | 'CONTENT_REVIEW_CHANGES_REQUESTED'
  | 'CONTENT_REVIEW_REJECTED'
  | 'CONTENT_REVIEW_PUBLISHED'
  | 'ANNOUNCEMENT'
  | 'SYSTEM'
  | 'REVIEW_FEEDBACK'
  | 'BILLING';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionPath?: string | null;
  readAt?: string | null;
  eventKey?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationRecord[];
  nextCursor: string | null;
  totalUnread: number;
}

export interface UnreadCountResponse {
  count: number;
}
