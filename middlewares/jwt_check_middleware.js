const jwt = require('jsonwebtoken');



// db models
const user_module = require('../model/userModel');
const admin_module = require('../model/admin_module');



// Define helper functions locally
const {
    checkRequestAuth,
    toStr,
} = require('../helper/helper_functions');



const jwt_check_middleware = async (req, res, next) => {
    console.log(" req.body-", req.body)
    if (
        req.path === "/api-check-mobile" ||
        req.path === '/api-user-registration' ||
        req.path === '/api-user-status' ||
        req.path === '/api-user-login' ||
        req.path === '/admin/loginCheck' || 
        // req.path === '/api/create-order' || 
        req.path === '/api/get-services'

    ) {
        next();
        return;
    }

    let token;

    if (req.path.includes('/api')) {
        console.log("--------------path check in mobile API----------", req.path)
        let { app_key, env_type } = req?.body || { app_key: '', env_type: '' };

        app_key = toStr(app_key);
        // console.log(`(((((((()))))) ~ jwt_check_middleware.js:84 ~ jwt_check_middleware ~ app_key:`, app_key);

        env_type = toStr(env_type);
        // console.log(`(((((((()))))) ~ jwt_check_middleware.js:84 ~ jwt_check_middleware ~ env_type:`, env_type);

        if (!app_key || !env_type) {
            console.log('Missing required parameters');
            return res.status(400).json({ success: false, msg: 'Missing required parameters' });
        }

        let auth = checkRequestAuth(app_key, env_type);
        if (auth === 0) {
            return res.status(401).json({ success: false, msg: 'Unauthorized' });
        }

        token = req?.body?.unique_jwt_token || req?.query?.unique_jwt_token;
        // console.log("token in api", token);
    } else {
        console.log("--------------path check in Admin API----------", req.path)
        console.log("else /api");
        token =
            req?.signedCookies?.unique_jwt_token ||  // 🔑 always check signedCookies first
            req?.cookies?.unique_jwt_token ||
            req?.body?.unique_jwt_token ||
            req?.query?.unique_jwt_token ||
            req?.params?.unique_jwt_token;
    }

    if (!token) {
        // console.log(`(((((((()))))) ~ jwt_check_middleware.js:106 ~ jwt_check_middleware ~ token:`, token);
        return res.status(401).json({ success: false, jwt_error_msg: 'No token provided test' });
    }

    // NEW: Handle URL encoding and session prefix
    try {
        // URL decode if necessary
        try {
            token = decodeURIComponent(token);
        } catch (e) {
            // If it's not URL encoded, continue with original token
            console.log('Token is not URL encoded');
        }

        // Remove session prefix if present
        if (token.startsWith("s:")) {
            token = token.substring(2);
        }

        // Ensure we only have the JWT part (in case there's additional data)
        const parts = token.split('.');
        if (parts.length >= 3) {
            token = parts.slice(0, 3).join('.');
        } else {
            console.error('Invalid JWT format: Token does not have 3 parts');
            return res.status(401).json({ success: false, jwt_error_msg: "Invalid token format" });
        }
    } catch (error) {
        console.error('Error processing token:', error);
        return res.status(401).json({ success: false, jwt_error_msg: "Invalid token format" });
    }

    // console.log("Processed token:", token);

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err || !decoded) {
            return res.status(401).json({ success: false, jwt_error_msg: "Invalid token" });
        }

        // Check for user
        if (decoded.user) {
            const user = await user_module.findById(decoded.user);
            if (!user) {
                return res.status(401).json({ success: false, jwt_error_msg: "User not found" });
            }
            console.log("decoded?.device_id !== user?.device_id---", decoded?.device_id !== user?.device_id)
            console.log(decoded?.device_id, "----------ttttttttttt--------", user?.device_id)

            if (decoded?.device_id !== user?.device_id) {
                return res.status(400).json({ success: false, msg: "Already loggedIn other device, Relogin here for log out other device!", status: 0 })
            }


            req.user = user;
            return next();
        }

        // Check for admin
        if (decoded.admin?._id) {
            const admin = await admin_module.findById(decoded.admin._id);
            console.log("🚀 ~ jwt_check_middleware ~ admin:", admin)
            if (!admin) {
                return res.status(401).json({ success: false, jwt_error_msg: "Admin not found" });
            }

            const accessing = req?.body?.accessing || req?.query?.accessing;
            console.log("🚀 ~ jwt_check_middleware ~ accessing:", accessing)

            if (
                admin.admin_type === 1 &&
                !(admin.accessMenus.includes(accessing) || accessing === 'admin_login' || accessing === 'logout' || accessing === 'sub_admin')
            ) {

                console.log("sub admin true, access menu check false-", admin.accessMenus.includes(accessing));


                if (!accessing && req.method === 'POST' && req.path.includes('add-manual-payment-details')) {
                    const formDataAccessing = req?.body?.accessing;
                    if (formDataAccessing && admin.accessMenus.includes(formDataAccessing)) {
                        return next();
                    }
                }

                return res.status(401).json({
                    success: false,
                    page_not_allowed_error_msg: "You are not allowed to access this menu"
                });
            }

            console.log("final login phase ---------------")
            req.admin = admin;
            return next();
        }

        return res.status(401).json({ success: false, jwt_error_msg: "Invalid token structure" });
    });
}

module.exports = {
    jwt_check_middleware
};





















// const jwt = require('jsonwebtoken');

// const {
//     checkRequestAuth,
//     toStr,
// } = require('../helper/helper_functions');

// // db models
// const user_module = require('../model/user_module');
// const admin_module = require('../model/admin_module');

// const jwt_check_middleware = async (req, res, next) => {
//     if (
//         req.path === "/api-app-info-data" ||
//         req.path === "/api-forget-password-mpin" ||
//         req.path === "/api-change-password-mpin" ||
//         req.path === "/api-get-app-key" ||
//         req.path === "/api-check-mobile" ||
//         req.path === "/api-check-username" ||
//         req.path === "/api-otp-sent" ||
//         req.path === '/api-user-registration' ||
//         req.path === '/api-user-status' ||
//         req.path === '/api-user-login' ||
//         req.path === '/api-check-user-deviceid' ||
//         req.path === '/api-forgot-password' ||
//         req.path === "/api-forget-check-mobile" ||
//         req.path === '/api-get-state' ||
//         req.path === '/api-get-district' ||
//         req.path === '/api-admin-bank-details' ||
//         req.path === "/api-get-social-data" ||
//         req.path === "/api-get-update-result" ||
//         req.path === '/api-get-slider-images' ||
//         req.path === "/api-check-games-active-inactive" ||
//         req.path === "/api_get_contact" ||
//         req.path === "/api-submit-contact-us" ||
//         req.path === "/api-view-tips-details" ||
//         req.path === "/api-get-app-version-details" ||
//         req.path === "/api-starline-game-rates" ||
//         req.path === "/api-starline-game" ||
//         req.path === "/api-check-starline-game-status" ||
//         req.path === "/api-check-starline-games-active-inactive" ||
//         req.path === "/api-starline-gamenames" ||
//         req.path === "/api-starline-result-history-data" ||
//         req.path === "/api-galidisswar-game-rates" ||
//         req.path === "/api-galidisswar-game" ||
//         req.path === "/api-check-galidisswar-game-status" ||
//         req.path === "/api-check-galidisswar-games-active-inactive" ||
//         req.path === "/api-galidisswar-gamenames" ||
//         req.path === "/api-disawar-result-history-data" ||
//         req.path === "/api-check-roulette-game-status" ||
//         req.path === "/api-get-chat-app" ||
//         req.path === "/api-chat-app" ||
//         req.path === "/api-resend-otp" ||
//         req.path.includes("/file/uploads") ||
//         req.path.includes("/api-get-qrcode") ||
//         req.path.includes("/game-result-chart") ||
//         req.path.includes("/game-result-galidessar-chart-details") ||

//         // for admin
//         req.path === '/admin/loginCheck' ||
//         req.path === '/admin/add-manual-payment-details' ||
//         req.path === '/admin/delete-manual-payment-details' ||
//         req.path === '/admin/add-qrcode-image' ||
//         req.path === '/admin/change-wingo-result'
//     ) {
//         next();
//         return;
//     }

//     let token;

//     if (req.path.includes('/api')) {
//         // console.log("path check in middleware", req)
//         let { app_key, env_type } = req?.body || { app_key: '', env_type: '' };

//         // console.log(`(((((((()))))) ~ jwt_check_middleware.js:77 ~ jwt_check_middleware ~ req?.body:`, req?.body);
//         // console.log(`(((((((()))))) ~ jwt_check_middleware.js:78 ~ jwt_check_middleware ~ app_key:`, app_key);
//         // console.log(`(((((((()))))) ~ jwt_check_middleware.js:81 ~ jwt_check_middleware ~ env_type:`, env_type);

//         app_key = toStr(app_key);
//         console.log(`(((((((()))))) ~ jwt_check_middleware.js:84 ~ jwt_check_middleware ~ app_key:`, app_key);

//         env_type = toStr(env_type);

//         console.log(`(((((((()))))) ~ jwt_check_middleware.js:84 ~ jwt_check_middleware ~ env_type:`, env_type);

//         if (!app_key || !env_type) {
//             console.log('Missing required parameters');
//             return res.status(400).json({ success: false, msg: 'Missing required parameters' });
//         }

//         let auth = checkRequestAuth(app_key, env_type);
//         if (auth === 0) {
//             return res.status(401).json({ success: false, msg: 'Unauthorized' });
//         }

//         token = req?.body?.unique_jwt_token || req?.query?.unique_jwt_token

//         console.log("token in api", token)
//     } else {
//         console.log("else /api")
//         token =
//             req?.signedCookies?.unique_jwt_token ||  // 🔑 always check signedCookies first
//             req?.cookies?.unique_jwt_token ||
//             req?.body?.unique_jwt_token ||
//             req?.query?.unique_jwt_token ||
//             req?.params?.unique_jwt_token;


//         // Handle the "s:" prefix if somehow passed directly
//         if (token && token.startsWith("s:")) {
//             token = token.split(".").slice(0, 3).join(".");
//         }

//     }

//     if (!token) {
//         console.log(`(((((((()))))) ~ jwt_check_middleware.js:106 ~ jwt_check_middleware ~ token:`, token);
//         return res.status(401).json({ success: false, jwt_error_msg: 'No token provided test' });
//     }

//     jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {

//         if (err || !decoded) {
//             return res.status(401).json({ success: false, jwt_error_msg: "Invalid token" });
//         }

//         // Check for user

//         if (decoded.user) {
//             const user = await user_module.findById(decoded.user);
//             if (!user) {
//                 return res.status(401).json({ success: false, jwt_error_msg: "User not found" });
//             }
//             req.user = user;

//             return next();
//         }

//         // Check for admin
//         if (decoded.admin?._id) {
//             const admin = await admin_module.findById(decoded.admin._id);
//             if (!admin) {
//                 return res.status(401).json({ success: false, jwt_error_msg: "Admin not found" });
//             }

//             const accessing = req?.body?.accessing || req?.query?.accessing;

//             if (
//                 admin.admin_type === 1 &&
//                 !(
//                     admin.accessMenus.includes(accessing) ||
//                     accessing === 'admin_login' ||
//                     accessing === 'logout' ||
//                     accessing === 'sub_admin'
//                 )
//             ) {
//                 if (!accessing && req.method === 'POST' && req.path.includes('add-manual-payment-details')) {
//                     const formDataAccessing = req?.body?.accessing;
//                     if (formDataAccessing && admin.accessMenus.includes(formDataAccessing)) {
//                         return next();
//                     }
//                 }

//                 return res.status(401).json({
//                     success: false,
//                     page_not_allowed_error_msg: "You are not allowed to access this menu"
//                 });
//             }

//             // console.log("final login phase")
//             req.admin = admin;
//             return next();
//         }

//         return res.status(401).json({ success: false, jwt_error_msg: "Invalid token structure" });
//     });
// }

// module.exports = {
//     jwt_check_middleware
// };