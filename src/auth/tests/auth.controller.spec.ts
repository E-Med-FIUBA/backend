import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginDTO } from '../dto/login.dto';
import { ResetPasswordRequest } from '../dto/password-reset.dto';
import { PharmacistRegisterDTO } from '../../models/pharmacists/dto/pharmacist-register.dto';
import { DoctorRegisterDTO } from '../../models/doctors/dto/doctor-register.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            registerDoctor: jest.fn(),
            registerPharmacist: jest.fn(),
            loginPharmacist: jest.fn(),
            loginDoctor: jest.fn(),
            logout: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('registerDoctor', () => {
    it('should register a doctor', async () => {
      const doctor: DoctorRegisterDTO = {
        license: '12345',
        specialtyId: 1,
        certificate: 'cert123',
        password: 'password123',
        name: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        dni: 12345678,
      };
      jest
        .spyOn(authService, 'registerDoctor')
        .mockResolvedValueOnce(undefined);

      const result = await authController.registerDoctor(doctor);
      expect(result).toEqual({ message: 'Doctor creation in progress' });
      expect(authService.registerDoctor).toHaveBeenCalledWith(doctor);
    });
  });

  describe('registerPharmacist', () => {
    it('should register a pharmacist', async () => {
      const pharmacist: PharmacistRegisterDTO = {
        license: '67890',
        password: 'password456',
        name: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        dni: 87654321,
      };
      const token = 'mockToken';
      jest
        .spyOn(authService, 'registerPharmacist')
        .mockResolvedValueOnce({ token });

      const result = await authController.registerPharmacist(pharmacist);
      expect(result).toEqual({ token });
      expect(authService.registerPharmacist).toHaveBeenCalledWith(pharmacist);
    });
  });

  describe('loginPharmacist', () => {
    it('should login a pharmacist', async () => {
      const loginInfo: LoginDTO = {
        email: 'pharmacist@example.com',
        password: 'password123',
      };
      const token = 'mockToken';
      const loginResult = { token, userId: 1 };
      jest
        .spyOn(authService, 'loginPharmacist')
        .mockResolvedValueOnce(loginResult);

      const result = await authController.loginPharmacist(loginInfo);
      expect(result).toEqual(loginResult);
      expect(authService.loginPharmacist).toHaveBeenCalledWith(loginInfo);
    });
  });

  describe('loginDoctor', () => {
    it('should login a doctor', async () => {
      const loginInfo: LoginDTO = {
        email: 'pharmacist@example.com',
        password: 'password123',
      };
      const token = 'mockToken';
      const loginResult = {
        token,
        userId: 1,
        license: '12345',
        specialty: 'Cardiology',
        name: 'John',
        lastName: 'Doe',
      };
      jest.spyOn(authService, 'loginDoctor').mockResolvedValueOnce(loginResult);

      const result = await authController.loginDoctor(loginInfo);
      expect(result).toEqual(loginResult);
      expect(authService.loginDoctor).toHaveBeenCalledWith(loginInfo);
    });
  });

  describe('logout', () => {
    it('should logout', async () => {
      jest.spyOn(authService, 'logout').mockResolvedValueOnce(undefined);

      const result = await authController.logout();
      expect(result).toBeUndefined();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const body: ResetPasswordRequest = { email: 'test@example.com' };
      jest.spyOn(authService, 'resetPassword').mockResolvedValueOnce(undefined);

      await authController.resetPassword(body);
      expect(authService.resetPassword).toHaveBeenCalledWith(body.email);
    });
  });
});
