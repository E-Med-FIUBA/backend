import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  deleteUser,
} from 'firebase/auth';
import { firebaseApp } from '../firebase/firebase';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DoctorsService } from '../models/doctors/doctors.service';
import { LoginDTO } from './dto/login.dto';
import { UsersService } from '../models/users/users.service';
import { User } from '@prisma/client';
import { Token } from './interfaces/token';
import { PharmacistsService } from '../models/pharmacists/pharmacists.service';
import { UserRegisterDTO } from '../models/users/dto/user-register.dto';
import { DoctorRegisterDTO } from '../models/doctors/dto/doctor-register.dto';
import { PharmacistRegisterDTO } from '../models/pharmacists/dto/pharmacist-register.dto';
import { PrismaTransactionalClient } from 'utils/types';
import { PrismaService } from 'src/prisma.service';
import { pki } from 'node-forge';

@Injectable()
export class AuthService {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly usersService: UsersService,
    private readonly pharmacistsService: PharmacistsService,
    private readonly prisma: PrismaService,
  ) {}

  async logout(): Promise<void> {
    const auth = getAuth(firebaseApp);
    try {
      await signOut(auth);
    } catch (error) {
      throw new BadRequestException({
        message: `Error while logging out: ${error}`,
      });
    }
  }

  async register(user: UserRegisterDTO, role: Role): Promise<Token> {
    try {
      switch (role) {
        // case Role.Doctor:
        //   return await this.registerDoctor(user as DoctorRegisterDTO);
        case Role.Pharmacist:
          return await this.registerPharmacist(user as PharmacistRegisterDTO);
        default:
          throw new BadRequestException({
            message: `Invalid role: ${role}`,
          });
      }
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          throw new ConflictException({
            message: `Email already in use: ${error}`,
          });
        case 'auth/invalid-email':
          throw new BadRequestException({ message: `Invalid email: ${error}` });
        case 'auth/weak-password':
          throw new BadRequestException({ message: `Weak password: ${error}` });
        default:
          throw new BadRequestException({
            message: `Error while registering: ${error}`,
          });
      }
    }
  }

  async createUser(
    user: UserRegisterDTO,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<{ credentials: UserCredential; user: User }> {
    const userData = {
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      dni: user.dni,
      uid: null,
    };

    const createdUser = await this.usersService.create(userData, tx);
    const credentials = await this.createFirebaseUser(user, createdUser.id, tx);

    return { credentials, user: createdUser };
  }

  async createFirebaseUser(
    user: UserRegisterDTO,
    userId: number,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<UserCredential> {
    const credentials = await createUserWithEmailAndPassword(
      getAuth(firebaseApp),
      user.email,
      user.password,
    );

    await this.usersService.update(
      userId,
      {
        uid: credentials.user.uid,
      },
      tx,
    );

    return credentials;
  }

  async registerDoctor(doctor: DoctorRegisterDTO) {
    return this.prisma.$transaction(
      async (tx) => {
        if (!pki.certificateFromPem(doctor.certificate)) {
          throw new BadRequestException({
            message: 'Certificado invalido',
          });
        }

        const { credentials: userCredentials, user } = await this.createUser(
          doctor,
          tx,
        );

        try {
          await this.doctorsService.create(
            {
              userId: user.id,
              license: doctor.license,
              specialtyId: doctor.specialtyId,
              certificate: doctor.certificate,
              name: user.name,
              lastName: user.lastName,
            },
            tx,
          );
        } catch (error) {
          await deleteUser(userCredentials.user);
          throw error;
        }
      },
      {
        timeout: 20000,
      },
    );
  }

  async registerPharmacist(pharmacist: PharmacistRegisterDTO): Promise<Token> {
    const { credentials: userCredentials, user } =
      await this.createUser(pharmacist);
    await this.pharmacistsService.create({
      userId: user.id,
      license: pharmacist.license,
    });

    return { token: await userCredentials.user.getIdToken() };
  }

  private async getUser(loginInfo: LoginDTO) {
    const { token, uid } = await this.getUserToken(loginInfo);
    const user = await this.usersService.findByUIDIncludeData(uid);

    return {
      user,
      token,
    };
  }

  async loginPharmacist(
    loginInfo: LoginDTO,
  ): Promise<{ token: string; userId: number }> {
    const { token, user } = await this.getUser(loginInfo);
    if (!user?.pharmacist) {
      throw new UnauthorizedException({
        message: 'User is not a doctor',
      });
    }

    return { token, userId: user?.id };
  }

  async loginDoctor(loginInfo: LoginDTO): Promise<{
    token: string;
    userId: number;
    license: string;
    specialty: string;
    name: string;
    lastName: string;
  }> {
    const { token, user } = await this.getUser(loginInfo);
    if (!user?.doctor) {
      throw new UnauthorizedException({
        message: 'User is not a doctor',
      });
    }

    if (!this.doctorsService.isActiveDoctor(user.doctor.id)) {
      throw new UnauthorizedException({
        message: 'Doctor is being processed',
      });
    }

    return {
      token,
      userId: user?.id,
      license: user.doctor.license,
      specialty: user.doctor.specialty.name,
      name: user.name,
      lastName: user.lastName,
    };
  }

  async getUserToken(
    loginInfo: LoginDTO,
  ): Promise<{ token: string; uid: string }> {
    const auth = getAuth(firebaseApp);
    let userCredentials: UserCredential;
    let token: string;
    try {
      userCredentials = await signInWithEmailAndPassword(
        auth,
        loginInfo.email,
        loginInfo.password,
      );
      token = await userCredentials.user.getIdToken();
    } catch (error) {
      throw new BadRequestException({
        message: 'Invalid Credentials',
      });
    }

    return { token, uid: userCredentials.user.uid };
  }

  async resetPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('Invalid email');

    const auth = getAuth(firebaseApp);
    sendPasswordResetEmail(auth, email);
  }
}
