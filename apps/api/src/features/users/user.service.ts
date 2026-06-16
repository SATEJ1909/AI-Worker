import { prisma } from "../../config/prisma.js"; 
import z from 'zod';
import dotenv from 'dotenv'
dotenv.config();
import bcrypt from 'bcrypt';

const requiredSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const publicUserSelect = {
    id: true,
    name: true,
    email: true,
    createdAt: true,
} as const;

export const signUp = async (email: string, password: string) => {
    try {
        const validation = requiredSchema.safeParse({ email, password });
        if (!validation.success) {
            throw new Error('Invalid email or password format');
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingUser) {
            throw new Error('User already exists');
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: email, 
                password: hashedPassword
            },
            select: publicUserSelect,
        });

        return user;
    } catch (error) {
        console.error("Error in signUp service:", error);
        throw error;
    }
}

export const login = async (email: string, password: string) => {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!existingUser) {
            throw new Error("User does not exist. Create one first");
        }

        const isValidPassword = await bcrypt.compare(password, existingUser.password);

        if (!isValidPassword) {
            throw new Error("Incorrect Password");
        }

        return existingUser;
    } catch (error) {
        console.error("Error in login service:", error);
        throw error;
    }
}

export const getProfile = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: publicUserSelect,
        });
        return user;
    } catch (error) {
        console.error("Error in getProfile service:", error);
        throw error;
    }
}
