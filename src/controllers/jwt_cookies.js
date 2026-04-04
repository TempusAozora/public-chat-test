import jwt from "./jwt_promises.js";

export function tokenCookies(secretkey) {
    return function(req, res, next) {  
        const original_cookies = res.cookie;

        res.cookie = async function(key, value, options) { // Will soon make it expire after 7 days.
            const token = await jwt.sign({payload: value}, secretkey);
            original_cookies.call(this, key, token, options);
        };
        
        next();
    };
}

export function parseCookies(secretKey, BYPASS_UPGRADE=false) {
    return async function(req, res, next) {
        if (!BYPASS_UPGRADE && req.headers.upgrade) {
            return next && next();
        }

        const cookie_raw = `; ${req.headers.cookie}`;
        let cookies = cookie_raw.split(`; `);
        cookies.shift();

        const token_cookies = await new Promise((resolve) => {
            const result = cookies.reduce( async (acc, curr) => {
                const [key, value] = curr.split('=');
                const decoded = await jwt.decode(value, secretKey);
                acc[key] = decoded && decoded.payload;
                return acc;
            }, {});
            
            resolve(result);
        });

        req.token_cookie = token_cookies;
        next && next();
    };
}