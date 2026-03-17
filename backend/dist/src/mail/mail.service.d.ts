export declare class MailService {
    private readonly transporter;
    private readonly from;
    private readonly frontendUrl;
    private ensureConfigured;
    sendActivationEmail(email: string, token: string): Promise<void>;
}
