import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { DoctorsService } from '../../models/doctors/doctors.service';
import { UsersService } from '../../models/users/users.service';
import { PharmacistsService } from '../../models/pharmacists/pharmacists.service';
import { PrismaService } from '../../prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import { PharmacistRegisterDTO } from '../../models/pharmacists/dto/pharmacist-register.dto';
import { LoginDTO } from '../dto/login.dto';

jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let pharmacistsService: PharmacistsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DoctorsService,
          useValue: {
            create: jest.fn(),
            isActiveDoctor: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findByUIDIncludeData: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: PharmacistsService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
        {
          provide: 'FirebaseApp',
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    pharmacistsService = module.get<PharmacistsService>(PharmacistsService);
  });

  describe('logout', () => {
    it('should log out successfully', async () => {
      await service.logout();
      expect(signOut).toHaveBeenCalled();
    });

    it('should throw BadRequestException if sign out fails', async () => {
      (signOut as jest.Mock).mockRejectedValue(new Error('Sign out error'));

      await expect(service.logout()).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerPharmacist', () => {
    it('should register a pharmacist successfully', async () => {
      const userCredentialsMock = {
        user: { getIdToken: jest.fn().mockResolvedValue('token') },
      };
      const createUserMock = jest.fn().mockResolvedValue({
        credentials: userCredentialsMock,
        user: { id: 1 },
      });
      const createPharmacistMock = jest.fn();

      service.createUser = createUserMock;
      pharmacistsService.create = createPharmacistMock;

      const pharmacist: PharmacistRegisterDTO = {
        email: 'test@example.com',
        password: 'password',
        name: 'John',
        lastName: 'Doe',
        dni: 12345678,
        license: '12345',
      };

      const result = await service.registerPharmacist(pharmacist);

      expect(createUserMock).toHaveBeenCalledWith(pharmacist);
      expect(createPharmacistMock).toHaveBeenCalledWith({
        userId: 1,
        license: '12345',
      });
      expect(result).toEqual({ token: 'token' });
    });
  });

  describe('loginPharmacist', () => {
    it('should login a pharmacist successfully', async () => {
      const getUserMock = jest
        .fn()
        .mockResolvedValue({ token: 'token', user: { id: 1, pharmacist: {} } });
      service.getUser = getUserMock;

      const loginInfo: LoginDTO = {
        email: 'test@example.com',
        password: 'password',
      };

      const result = await service.loginPharmacist(loginInfo);

      expect(getUserMock).toHaveBeenCalledWith(loginInfo);
      expect(result).toEqual({ token: 'token', userId: 1 });
    });

    it('should throw UnauthorizedException if user is not a pharmacist', async () => {
      const getUserMock = jest
        .fn()
        .mockResolvedValue({ token: 'token', user: { id: 1 } });
      service.getUser = getUserMock;

      const loginInfo: LoginDTO = {
        email: 'test@example.com',
        password: 'password',
      };

      await expect(service.loginPharmacist(loginInfo)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email successfully', async () => {
      const findByEmailMock = jest.fn().mockResolvedValue({ id: 1 });
      usersService.findByEmail = findByEmailMock;

      await service.resetPassword('test@example.com');

      expect(findByEmailMock).toHaveBeenCalledWith('test@example.com');
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        undefined,
        'test@example.com',
      );
    });

    it('should throw BadRequestException if email is invalid', async () => {
      const findByEmailMock = jest.fn().mockResolvedValue(null);
      usersService.findByEmail = findByEmailMock;

      await expect(service.resetPassword('test@example.com')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
