"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.isEncrypted = isEncrypted;
const crypto_1 = __importDefault(require("crypto"));
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'minha-chave-secreta-de-32-chars-default!!';
const ALGORITHM = 'aes-256-cbc';
function getKey() {
    const key = ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32);
    return Buffer.from(key, 'utf8');
}
function encrypt(text) {
    const key = getKey();
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}
function decrypt(encryptedText) {
    try {
        const key = getKey();
        const textParts = encryptedText.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedData = textParts.join(':');
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Erro ao descriptografar:', error);
        return '';
    }
}
function isEncrypted(text) {
    return text.includes(':') && text.length > 32;
}
//# sourceMappingURL=crypto.js.map