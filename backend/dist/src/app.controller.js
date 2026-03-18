"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const links_service_1 = require("./links/links.service");
let AppController = class AppController {
    linksService;
    constructor(linksService) {
        this.linksService = linksService;
    }
    async redirect(shortCode, res, req) {
        if (shortCode === 'api' || shortCode === 'favicon.ico') {
            return res.status(404).send('Not Found');
        }
        const link = await this.linksService.findByShortCode(shortCode);
        if (!link || !link.isActive) {
            throw new common_1.NotFoundException('Link not found or is deactivated.');
        }
        if (link.expiresAt && link.expiresAt < new Date()) {
            throw new common_1.NotFoundException('Link has expired.');
        }
        if (link.maxClicks !== null && link.clicks >= link.maxClicks) {
            await this.linksService.update(link.id, link.userId, { isActive: false });
            throw new common_1.NotFoundException('Link has expired.');
        }
        if (link.password) {
            return res.redirect(`http://localhost:4200/unlock/${shortCode}`);
        }
        await this.linksService.recordClick(link.id, {
            ip: req.ip || 'Unknown',
            userAgent: req.headers['user-agent'] || '',
            referer: req.headers['referer'] || '',
        });
        return res.redirect(link.originalUrl);
    }
    async verifyPassword(shortCode, body, req) {
        const link = await this.linksService.findByShortCode(shortCode);
        if (!link || !link.isActive)
            throw new common_1.NotFoundException('Link not found');
        if (link.expiresAt && link.expiresAt < new Date())
            throw new common_1.NotFoundException('Link has expired.');
        if (link.maxClicks !== null && link.clicks >= link.maxClicks) {
            await this.linksService.update(link.id, link.userId, { isActive: false });
            throw new common_1.NotFoundException('Link has expired.');
        }
        if (link.password !== body.password)
            throw new common_1.UnauthorizedException('Incorrect password');
        await this.linksService.recordClick(link.id, {
            ip: req.ip || 'Unknown',
            userAgent: req.headers['user-agent'] || '',
            referer: req.headers['referer'] || '',
        });
        return { url: link.originalUrl };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('s/:shortCode'),
    __param(0, (0, common_1.Param)('shortCode')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "redirect", null);
__decorate([
    (0, common_1.Post)('s/:shortCode/verify-password'),
    __param(0, (0, common_1.Param)('shortCode')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "verifyPassword", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [links_service_1.LinksService])
], AppController);
//# sourceMappingURL=app.controller.js.map