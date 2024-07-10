import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from 'firebase/auth';
import { firebaseApp } from '../firebase/firebase';
import {
  BadRequestException,
  ConflictException,
  Injectable,
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

@Injectable()
export class AuthService {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly usersService: UsersService,
    private readonly pharmacistsService: PharmacistsService,
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
        case Role.Doctor:
          return await this.registerDoctor(user as DoctorRegisterDTO);
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
  ): Promise<{ credentials: UserCredential; user: User }> {
    const credentials = await createUserWithEmailAndPassword(
      getAuth(firebaseApp),
      user.email,
      user.password,
    );

    const userData = {
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      dni: user.dni,
      birthDate: user.birthDate,
      uid: credentials.user.uid,
    };
    const createdUser = await this.usersService.create(userData);

    return { credentials, user: createdUser };
  }

  async registerDoctor(doctor: DoctorRegisterDTO): Promise<Token> {
    const { credentials: userCredentials, user } =
      await this.createUser(doctor);
    await this.doctorsService.create({
      userId: user.id,
      certification: doctor.certification,
    });

    return { token: await userCredentials.user.getIdToken() };
  }

  async registerPharmacist(pharmacist: PharmacistRegisterDTO): Promise<Token> {
    const { credentials: userCredentials, user } =
      await this.createUser(pharmacist);
    await this.pharmacistsService.create({
      userId: user.id,
      certification: pharmacist.certification,
    });

    return { token: await userCredentials.user.getIdToken() };
  }

  async login(loginInfo: LoginDTO): Promise<{ token: string; userId: number }> {
    const { token, uid } = await this.getUserToken(loginInfo);
    const user = await this.usersService.findByUID(uid);

    return { token, userId: user?.id };
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
