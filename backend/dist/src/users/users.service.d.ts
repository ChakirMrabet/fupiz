import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(email: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    create(data: Prisma.UserCreateInput): Promise<User>;
    update(id: number, data: Partial<User>): Promise<User>;
}
