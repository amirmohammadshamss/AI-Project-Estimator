import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let usersService: UsersService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    usersService = new UsersService(prisma as unknown as PrismaService);
  });

  it('hashes the password and never stores it in plain text', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'user-1',
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await usersService.create('jane@example.com', 'super-secret-password');

    const createArgs = prisma.user.create.mock.calls[0][0];
    expect(createArgs.data.passwordHash).not.toBe('super-secret-password');
    expect(createArgs.data.passwordHash).toMatch(/^\$argon2/);
  });

  it('rejects registration with an email that already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'jane@example.com' });

    await expect(usersService.create('jane@example.com', 'password')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('verifies a correct password against its hash', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'user-1',
        email: data.email,
        passwordHash: data.passwordHash,
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    await usersService.create('jane@example.com', 'super-secret-password');
    const passwordHash = prisma.user.create.mock.calls[0][0].data.passwordHash;

    await expect(usersService.verifyPassword('super-secret-password', passwordHash)).resolves.toBe(
      true,
    );
    await expect(usersService.verifyPassword('wrong-password', passwordHash)).resolves.toBe(false);
  });

  it('strips passwordHash from the returned user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'user-1',
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const result = await usersService.create('jane@example.com', 'super-secret-password');

    expect(result).not.toHaveProperty('passwordHash');
  });
});
