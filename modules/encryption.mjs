import crypto, { Decipheriv } from 'crypto';
import 'dotenv/config'

const algo = 'aes-256-gcm'
const iv_size = 12;

export function encrypt_ip(ip) {
    const iv = crypto.randomBytes(iv_size);
    const ip_key_buffer = Buffer.from(process.env.ENCRYPTED_IP_KEY, 'base64')

    const cipher = crypto.createCipheriv(
        algo,
        ip_key_buffer, 
        iv
    );

    let encrypted_ip = cipher.update(Buffer.from(ip, 'base64'));
    encrypted_ip = Buffer.concat([encrypted_ip, cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted_ip]).toString('base64'); // 44 bytes max
}

// decrypt_ip not yet tested.

// export function decrypt_ip(ip_encrypted) {
//     const iv = ip_encrypted.slice(0, 12);
//     const authTag = ip_encrypted.slice(12, 28);
//     const encrypted_ip = ip_encrypted.slice(28);

//     const decipher = crypto.createDecipheriv(
//         algo,
//         Buffer.from(process.env.ENCRYPTED_IP_KEY, 'base64'),
//         iv
//     )
//     decipher.setAuthTag(authTag);

//     let decrypted = decipher.update(ip_encrypted);
//     decrypted = Buffer.concat([decrypted, decipher.final()]);

//     return decrypted.toString();
// }