import jwt from 'jsonwebtoken';

async function sign(payload, key) {
    return (new Promise((resolve) => {
        const token = jwt.sign(payload, key);
        resolve(token);
    })).catch();
}

async function verify(token, key) {
    return ((new Promise((resolve) =>
        jwt.verify(token,key,(err,callback) => err ? resolve(false) : resolve(callback))
    )).catch());
}

async function decode(token, key) {
    return (new Promise((resolve) => {
        const decoded = jwt.decode(token, key);
        resolve(decoded);
    })).catch();
}

export default {sign, verify, decode};