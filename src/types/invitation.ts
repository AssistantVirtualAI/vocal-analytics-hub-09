
export interface OrganizationInvitation {
  id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
  organizationId: string;
}

export interface InvitationAcceptRequest {
  token: string;
  password?: string;
}

export interface InvitationResponse {
  success: boolean;
  message: string;
  organizationId?: string;
  organizationName?: string;
}
