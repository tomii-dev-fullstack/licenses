// src/utils/generateLicenseKey.js
import { randomBytes } from 'crypto';

export default function generateLicenseKey() {
  return randomBytes(12).toString('hex').toUpperCase().match(/.{1,4}/g).join('-');
}
