import express from 'express';
import { sql_query, sql_transaction } from '../controllers/sql_handler.js';
import { hash } from '../controllers/crypto_hash.js';
import { encrypt } from '../controllers/encryption.js';
import jwt from '../controllers/jwt_promises.js';
import { parseCookies, tokenCookies } from '../controllers/jwt_cookies.js';

const router = express.Router();

router.use(parseCookies(process.env.COOKIE_KEY));
router.use(tokenCookies(process.env.COOKIE_KEY));

router.get("/", async (req, res) => {
    const chat_messages = await sql_query('get_message_history');
    const ip_hashed = hash(req.ip, process.env.HASHED_IP_KEY);
    const ip_encrypted = encrypt(req.ip, process.env.ENCRYPTED_IP_KEY);

    const anon_token = req.token_cookie.anon_token;

    if (!anon_token) {
        const anon_data = await sql_transaction('get_anon_data', [[ip_hashed], [], [ip_encrypted, ip_hashed]], true);
        res.cookie('anon_token', anon_data.anon_id, {httpOnly: true, secure: req.socket.encrypted});
    } else {
        const decoded = await jwt.verify(anon_token, process.env.anon_token_KEY);
        if (!decoded) {
            const anon_data = await sql_transaction('get_anon_data', [[ip_hashed], [], [ip_encrypted, ip_hashed]], true);
            res.cookie('anon_token', anon_data.anon_id, {httpOnly: true, secure: req.socket.encrypted});
        }
    }
    
    res.render('index', {
        chat_messages: chat_messages,
        // current_viewers: get_viewer_count + 1
    });
});

export default router;