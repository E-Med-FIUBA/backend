import { pki, util } from 'node-forge';
import { KeyPair } from './types';
import { DoctorData } from './signature.service';

export function generateKeyPair(): KeyPair {
  return pki.rsa.generateKeyPair(2048);
}

export function generateCSR(keys: KeyPair, doctor: DoctorData) {
  const csr = pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([
    {
      name: 'commonName',
      value: `${doctor.name} ${doctor.lastName}`,
    },
    {
      name: 'countryName',
      value: doctor.countryName,
    },
    {
      shortName: 'ST',
      value: doctor.province,
    },
    {
      name: 'localityName',
      value: doctor.localityName,
    },
    {
      name: 'organizationName',
      value: 'EMED',
    },
    {
      shortName: 'OU',
      value: 'doctors',
    },
  ]);

  csr.sign(keys.privateKey);

  return csr;
}

export function safeDecode(bytes: string | null) {
  if (!bytes) {
    return null;
  }

  return bytes ? util.decode64(bytes) : null;
}
