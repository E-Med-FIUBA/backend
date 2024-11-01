import { pki, pkcs5, random, cipher as forgeCipher, util, Bytes } from "node-forge";
import { CipherConfig, CSR, KeyPair, PEM, PrivateKey, PublicKey, } from "./types";
import { generateCSR, generateKeyPair, safeDecode } from "./utils";
import { md as forgeMd, pss as forgePss, mgf as forgeMgf } from 'node-forge'
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";

export interface DoctorData {
    name: string;
    lastName: string;
    countryName?: string;
    province?: string;
    localityName?: string;
    userId: number;
    license: string;
    specialtyId: number;
    certificateRequest: null;
    privateKey: null;
    certificate: null

}

export interface ISignatureService {
    generateCredentials(doctorData: DoctorData): Promise<{ csr: PEM, privateKey: PEM }>;
    getPrivateKeyPEM(doctorId: number): Promise<PEM>;
    sign(doctorId: number, data: string): Promise<string>;
    verify(doctorId: number, data: string, signature: string): Promise<boolean>;
}

@Injectable()
export class SignatureService implements ISignatureService {
    cipher: forgeCipher.Algorithm = 'AES-CBC';

    constructor(private readonly prismaService: PrismaService) {

    }

    public async generateCredentials(doctorData: Omit<DoctorData, 'id'>): Promise<{ csr: pki.PEM; privateKey: pki.PEM; salt: string, iv: string }> {
        const keys = generateKeyPair();

        const csr = generateCSR(keys, doctorData);
        const { salt, iv } = await this.generateCipherConfig();
        const encryptedKey = await this.encrypt(util.decode64(salt), util.decode64(iv), keys.privateKey);

        return { csr: pki.certificationRequestToPem(csr), privateKey: encryptedKey, salt, iv }
    }

    private async getCSR(doctorId: number): Promise<CSR> {
        const { certificateRequest: csr } = await this.prismaService.doctor.findUnique({
            where: {
                id: doctorId
            },
            select: {
                certificateRequest: true
            }
        })

        if (!csr) {
            throw new Error('No CSR set');
        }
        return pki.certificationRequestFromPem(csr);
    }

    private async getPrivateKey(doctorId: number): Promise<PrivateKey> {
        const pkPEM = await this.getPrivateKeyPEM(doctorId);

        return pki.privateKeyFromPem(pkPEM);
    }

    public async getPrivateKeyPEM(doctorId: number): Promise<PEM> {
        const { privateKey: pk } = await this.prismaService.doctor.findUnique({
            where: {
                id: doctorId
            },
            select: {
                privateKey: true
            }
        })

        if (!pk) {
            throw new Error('No Private Key set');
        }

        const { salt, iv } = await this.getDoctorCipherConfig(doctorId);

        return this.decrypt(safeDecode(salt), safeDecode(iv), pk);
    }

    private async generateCipherConfig(): Promise<{ salt: string, iv: string }> {
        const salt = random.getBytesSync(128);
        const iv = random.getBytesSync(16);

        const encodedSalt = util.encode64(salt);
        const encodedIv = util.encode64(iv);

        return { salt: encodedSalt, iv: encodedIv };
    }

    private getCipherKey(salt: Bytes): string {
        return pkcs5.pbkdf2(process.env.ENCRIPTION_KEY, salt, parseInt(process.env.SALT_ROUNDS), parseInt(process.env.KEY_SIZE));
    }

    private async getDoctorCipherConfig(doctorId: number): Promise<CipherConfig> {
        const { salt, iv } = await this.prismaService.doctor.findUnique({
            where: {
                id: doctorId
            },
            select: {
                salt: true,
                iv: true
            }
        })

        return { salt, iv };
    }

    private async encrypt(salt: Bytes, iv: Bytes, privateKey: PrivateKey): Promise<string> {
        const key = await this.getCipherKey(salt);

        const cipher = forgeCipher.createCipher(this.cipher, key);
        cipher.start({ iv });
        cipher.update(util.createBuffer(pki.privateKeyToPem(privateKey)));
        cipher.finish();
        return cipher.output.toHex();
    }

    private async decrypt(salt: Bytes, iv: Bytes, encriptedKey: string): Promise<string> {
        const key = await this.getCipherKey(salt);


        encriptedKey = util.hexToBytes(encriptedKey);
        const decipher = forgeCipher.createDecipher(this.cipher, key);
        decipher.start({ iv: iv });
        decipher.update(util.createBuffer(encriptedKey));
        const result = decipher.finish();
        if (!result) {
            throw new Error('Invalid decipher');
        }
        return decipher.output.toString();
    }

    // Returns a base64 encoding of the signature
    public async sign(doctorId: number, data: string): Promise<string> {
        const privateKey = await this.getPrivateKey(doctorId);

        const md = forgeMd.sha1.create();
        md.update(data, 'utf8');
        const pss = forgePss.create({
            md: forgeMd.sha1.create(),
            mgf: forgeMgf.mgf1.create(forgeMd.sha1.create()),
            saltLength: 20
        });
        return util.encode64(privateKey.sign(md, pss));
    }

    public async verify(doctorId: number, data: string, signature: string): Promise<boolean> {
        const pss = forgePss.create({
            md: forgeMd.sha1.create(),
            mgf: forgeMgf.mgf1.create(forgeMd.sha1.create()),
            saltLength: 20
        });
        const md = forgeMd.sha1.create();
        md.update(data, 'utf8');

        const csr = await this.getCSR(doctorId);

        const publicKey = csr.publicKey! as PublicKey;

        return publicKey.verify(md.digest().getBytes(), util.decode64(signature), pss);
    }
}

