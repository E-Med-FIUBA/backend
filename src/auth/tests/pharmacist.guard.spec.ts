import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../guards/auth.guard';
import { UsersService } from '../../models/users/users.service';
import { FirebaseAdmin } from '../../firebase/firebase';

let mockUser = {
  id: 1,
  uid: 'test-uid',
  name: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  dni: 12345678,
  doctor: {
    id: 1,
    license: '12345',
    userId: 1,
    specialtyId: 1,
    certificate: 'cert123',
    specialty: {
      id: 1,
      name: 'Cardiology',
    },
  },
  pharmacist: {
    id: 1,
    license: '67890',
    userId: 1,
  },
};
const mockDecodedToken = {
  uid: 'test-uid',
  aud: 'test-aud',
  auth_time: 1234567890,
  exp: 1234567890,
  firebase: { sign_in_provider: 'password', identities: {} },
  iat: 1234567890,
  iss: 'https://securetoken.google.com/test-project',
  sub: 'test-uid',
};

describe('DoctorGuard', () => {
  let authGuard: AuthGuard;
  let usersService: UsersService;
  let firebaseAdmin: FirebaseAdmin;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: UsersService,
          useValue: {
            findByUIDIncludeData: jest.fn(),
          },
        },
        {
          provide: 'FirebaseAdmin',
          useValue: {
            auth: jest.fn().mockReturnValue({
              verifyIdToken: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    usersService = module.get<UsersService>(UsersService);
    firebaseAdmin = module.get<FirebaseAdmin>('FirebaseAdmin');
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  it('should return true if user is authenticated and pharmacist', async () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {
            authorization: 'Bearer test-token',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    mockUser = {
      ...mockUser,
      doctor: null,
    };

    jest
      .spyOn(firebaseAdmin.auth(), 'verifyIdToken')
      .mockResolvedValue(mockDecodedToken);
    jest
      .spyOn(usersService, 'findByUIDIncludeData')
      .mockResolvedValue(mockUser);

    const result = await authGuard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException if user is not pharmacist', async () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {
            authorization: 'Bearer test-token',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    mockUser = {
      ...mockUser,
      pharmacist: null,
    };

    jest
      .spyOn(firebaseAdmin.auth(), 'verifyIdToken')
      .mockResolvedValue(mockDecodedToken);
    jest.spyOn(usersService, 'findByUIDIncludeData').mockResolvedValue(null);

    await expect(authGuard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
