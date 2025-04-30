
export interface InvitationEmailRequest {
  email: string;
  organizationName?: string;
  invitationUrl: string;
}

export interface EmailResponse {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code: number;
    name: string;
  };
}
