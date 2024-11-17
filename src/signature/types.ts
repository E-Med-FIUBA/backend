import { pki } from "node-forge";

export type PublicKey = pki.rsa.PublicKey
export type PrivateKey = pki.rsa.PrivateKey
export type KeyPair = pki.rsa.KeyPair
export type PEM = pki.PEM
export type Certificate = pki.Certificate
