import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Link, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class LinksService {
  constructor(private prisma: PrismaService) {}

  generateShortCode(): string {
    return randomBytes(4).toString('hex');
  }

  async create(userId: number, data: any): Promise<Link> {
    // Generate a unique short code
    let shortCode = data.customCode || this.generateShortCode();
    // In a real prod environment we'd check for collision and retry
    return this.prisma.link.create({
      data: {
        originalUrl: data.originalUrl,
        shortCode,
        password: data.password || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        userId,
      },
    });
  }

  async findAll(userId: number): Promise<Link[]> {
    return this.prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByShortCode(shortCode: string): Promise<Link | null> {
    return this.prisma.link.findUnique({
      where: { shortCode },
    });
  }

  async update(id: number, userId: number, data: any): Promise<Link> {
    const link = await this.prisma.link.findFirst({ where: { id, userId } });
    if (!link) throw new NotFoundException('Link not found or unauthorized');
    
    return this.prisma.link.update({
      where: { id },
      data: {
        isActive: data.isActive !== undefined ? data.isActive : link.isActive,
        password: data.password !== undefined ? data.password : link.password,
        expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : link.expiresAt,
      },
    });
  }

  async remove(id: number, userId: number): Promise<Link> {
    const link = await this.prisma.link.findFirst({ where: { id, userId } });
    if (!link) throw new NotFoundException('Link not found or unauthorized');

    return this.prisma.link.delete({
      where: { id },
    });
  }

  async incrementClicks(id: number) {
    return this.prisma.link.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
  }
}
