import z from 'zod';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { prisma } from '@/database/prisma';
import { AppError } from '@/utils/AppError';
import { authConfig } from '@/configs/auth';
import { Request, Response } from 'express';

class SessionsController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    const { email, password } = bodySchema.parse(request.body);

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const passwordMatched = await compare(password, user.password);

    if (!passwordMatched) {
      throw new AppError('Invalid email or password', 401);
    }

    const { secret } = authConfig.jwt;

    const token = sign({ role: user.role ?? 'customer' }, secret, {
      subject: user.id,
      expiresIn: '30d',
    });

    const { password: hashedPassword, ...userWithoutPassword } = user;

    return response.json({ token, user: userWithoutPassword });
  }
}

export { SessionsController };
