"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let MailService = class MailService {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            }
            : undefined,
    });
    from = process.env.MAIL_FROM;
    supportInbox = process.env.SUPPORT_EMAIL || process.env.MAIL_FROM;
    frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    ensureConfigured() {
        if (!this.from || !this.supportInbox || !process.env.SMTP_HOST) {
            throw new common_1.InternalServerErrorException('Email delivery is not configured');
        }
    }
    async sendActivationEmail(email, token) {
        this.ensureConfigured();
        const activationUrl = new URL('/activate-account', this.frontendUrl);
        activationUrl.searchParams.set('token', token);
        await this.transporter.sendMail({
            from: this.from,
            to: email,
            subject: 'Activate your Fupiz account',
            text: [
                'Welcome to Fupiz.',
                '',
                'Activate your account by opening this link:',
                activationUrl.toString(),
                '',
                'This link expires automatically.',
            ].join('\n'),
            html: [
                '<p>Welcome to Fupiz.</p>',
                `<p><a href="${activationUrl.toString()}">Activate your account</a></p>`,
                '<p>This link expires automatically.</p>',
            ].join(''),
        });
    }
    async sendPublicContactEmail(payload) {
        this.ensureConfigured();
        await this.transporter.sendMail({
            from: this.from,
            to: this.supportInbox,
            replyTo: payload.email,
            subject: `[Public Contact] ${payload.subject}`,
            text: [
                'New public contact submission',
                '',
                `Name: ${payload.name}`,
                `Email: ${payload.email}`,
                `Subject: ${payload.subject}`,
                '',
                payload.message,
            ].join('\n'),
        });
    }
    async sendDashboardSupportEmail(payload) {
        this.ensureConfigured();
        await this.transporter.sendMail({
            from: this.from,
            to: this.supportInbox,
            replyTo: payload.userEmail,
            subject: `[Dashboard Support] ${payload.subject}`,
            text: [
                'New dashboard support request',
                '',
                `User: ${payload.userName || 'Unnamed user'}`,
                `Email: ${payload.userEmail}`,
                `Category: ${payload.category}`,
                `Subject: ${payload.subject}`,
                '',
                payload.message,
            ].join('\n'),
        });
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)()
], MailService);
//# sourceMappingURL=mail.service.js.map