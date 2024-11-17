import { pki, cipher as forgeCipher, util, Bytes } from "node-forge";
import { md as forgeMd, pss as forgePss, mgf as forgeMgf } from 'node-forge'
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { Certificate, PublicKey } from "./types";

export interface DoctorData {
    name: string;
    lastName: string;
    countryName?: string;
    province?: string;
    localityName?: string;
    userId: number;
    license: string;
    specialtyId: number;
    certificate: string;

}

export interface ISignatureService {
    verify(doctorId: number, data: string, signature: string): Promise<boolean>;
}

@Injectable()
export class SignatureService implements ISignatureService {

    constructor(private readonly prismaService: PrismaService) {

    }

    private async getCertificate(doctorId: number): Promise<Certificate> {
        const { certificate } = await this.prismaService.doctor.findUnique({
            where: {
                id: doctorId
            },
            select: {
                certificate: true
            }
        })

        if (!certificate) {
            throw new Error('No Certificate set');
        }
        return pki.certificateFromPem(certificate);
    }

    public async verify(doctorId: number, data: string, signature: string): Promise<boolean> {
        const pss = forgePss.create({
            md: forgeMd.sha1.create(),
            mgf: forgeMgf.mgf1.create(forgeMd.sha1.create()),
            saltLength: 20
        });
        const md = forgeMd.sha1.create();
        md.update(data, 'utf8');

        const certificate = await this.getCertificate(doctorId);

        const publicKey = certificate.publicKey! as PublicKey;

        return publicKey.verify(md.digest().getBytes(), util.decode64(signature), pss);
    }
}

