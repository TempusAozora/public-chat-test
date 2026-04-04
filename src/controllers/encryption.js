import crypto from 'crypto';
import 'dotenv/config';

const algo = 'aes-256-gcm';
const iv_size = 12;

export function encrypt(data, key) {
    const iv = crypto.randomBytes(iv_size);
    const data_key_buffer = Buffer.from(key, 'base64');

    const cipher = crypto.createCipheriv(
        algo,
        data_key_buffer, 
        iv
    );

    let encrypted_data = cipher.update(Buffer.from(data, 'base64'));
    encrypted_data = Buffer.concat([encrypted_data, cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted_data]).toString('base64'); // 44 bytes max
}

// decrypt_data not yet tested.

// export function decrypt(data_encrypted, key) {
//     const iv = data_encrypted.slice(0, 12);
//     const authTag = data_encrypted.slice(12, 28);
//     const encrypted_data = data_encrypted.slice(28);

//     const decipher = crypto.createDecipheriv(
//         algo,
//         Buffer.from(process.env.ENCRYPTED_data_KEY, 'base64'),
//         iv
//     )
//     decipher.setAuthTag(authTag);

//     let decrypted = decipher.update(data_encrypted);
//     decrypted = Buffer.concat([decrypted, decipher.final()]);

//     return decrypted.toString();
// }