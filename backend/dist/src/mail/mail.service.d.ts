export declare class MailService {
    private readonly transporter;
    private readonly from;
    private readonly supportInbox;
    private readonly frontendUrl;
    private ensureConfigured;
    sendActivationEmail(email: string, token: string): Promise<void>;
    sendPublicContactEmail(payload: {
        name: string;
        email: string;
        subject: string;
        message: string;
    }): Promise<void>;
    sendDashboardSupportEmail(payload: {
        userEmail: string;
        userName?: string | null;
        subject: string;
        category: string;
        message: string;
    }): Promise<void>;
}
