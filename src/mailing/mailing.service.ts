import { Injectable, Logger } from '@nestjs/common';

import { createTransport, Transporter } from 'nodemailer';

import { compile } from 'handlebars';

import { readFileSync } from 'fs';

import { toBuffer } from 'qrcode';
import {
  Doctor,
  InsuranceCompany,
  Patient,
  Prescription,
  Presentation,
  Sex,
  Specialty,
  User,
} from '@prisma/client';
import { PatientlessPrescriptionDTO } from 'src/models/prescriptions/dto/patientless-prescription.dto';

const logger = new Logger();

const TEMPLATE_DIR = 'templates/';

const sexMap = {
  [Sex.FEMALE]: 'Femenino',
  [Sex.MALE]: 'Masculino',
  [Sex.OTHER]: 'Otro',
};

@Injectable()
export class MailingService {
  private transporter: Transporter;
  private prescriptionTemplate: HandlebarsTemplateDelegate<any>;

  constructor() {
    this.transporter = createTransport({
      service: 'gmail',
      secure: false, // TODO: Check if this is correct
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    this.transporter.verify((error) => {
      if (error) {
        console.error(error);
      } else {
        logger.log('Server is ready to send emails');
      }
    });

    this.prescriptionTemplate = this.loadTemplate('prescription.hbs');
  }

  private loadTemplate(templateName: string): HandlebarsTemplateDelegate<any> {
    const template = readFileSync(TEMPLATE_DIR + templateName, 'utf8');
    return compile(template);
  }

  public async sendMail(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      text,
    });
  }

  public async sendPrescription(
    to: string,
    patient: Patient,
    doctor: Doctor,
    prescription: Prescription,
  ): Promise<void> {
    toBuffer(
      prescription.id.toString(),
      { type: 'png', scale: 10 },
      (error, buffer) => {
        if (error) {
          console.error(error);
        } else {
          const attachments = [];
          attachments.push({
            filename: 'qrcode.png',
            content: buffer,
            cid: 'qrcode',
          });

          this.transporter.sendMail({
            from: process.env.MAIL_USER,
            to,
            subject: 'Prescription', // TODO: Change this
            html: this.prescriptionTemplate({
              patient: {
                ...patient,
                birthDate: patient.birthDate.toISOString().split('T')[0],
                sex: sexMap[patient.sex],
              },
              doctor,
              prescription: {
                ...prescription,
                emitedAt: prescription.emitedAt.toISOString().split('T')[0],
              },
              qrCode: 'cid:qrcode',
            }),
            attachments,
          });
        }
      },
    );
  }

  public async sendPatientlessPrescription(
    prescriptionData: PatientlessPrescriptionDTO,
    insuranceCompany: InsuranceCompany,
    doctorUser: User & { doctor: Doctor; specialty: Specialty },
    prescription: Prescription,
    presentation: Presentation,
  ): Promise<void> {
    toBuffer(
      prescription.id.toString(),
      { type: 'png', scale: 10 },
      (error, buffer) => {
        if (error) {
          console.error(error);
        } else {
          const attachments = [];
          attachments.push({
            filename: 'qrcode.png',
            content: buffer,
            cid: 'qrcode',
          });

          this.transporter.sendMail({
            from: process.env.MAIL_USER,
            to: prescriptionData.email,
            subject: 'Prescription', // TODO: Change this
            html: this.prescriptionTemplate({
              // TODO: Check these have the template variables
              patient: {
                name: prescriptionData.name,
                lastName: prescriptionData.lastName,
                insuranceCompany,
                dni: prescriptionData.dni,
                birthDate: prescriptionData.birthDate,
                sex: sexMap[prescriptionData.sex],
              },
              doctor: {
                user: doctorUser,
                license: doctorUser.doctor.license,
                specialty: doctorUser.specialty,
              },
              prescription: {
                presentation,
                emitedAt: prescription.emitedAt.toISOString().split('T')[0],
                quantity: prescriptionData.quantity,
              },
              qrCode: 'cid:qrcode',
            }),
            attachments,
          });
        }
      },
    );
  }
}
