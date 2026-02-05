// middlewares/jwt_check_middleware.js
const jwt = require('jsonwebtoken');
const user_module = require('../model/userModel');
const admin_module = require('../model/admin_module');

const jwt_check_middleware = async (req, res, next) => {
    console.log("=== JWT MIDDLEWARE START ===");
    console.log("📦 Path:", req.path);
    console.log("📦 Method:", req.method);
    
    // Skip auth for these paths
    if (
        req.path === "/api-check-mobile" ||
        req.path === '/api-user-registration' ||
        req.path === '/api-user-status' ||
        req.path === '/api-user-login' ||
        req.path === '/admin/loginCheck' ||
        req.path === '/api/get-services'
    ) {
        console.log("✅ Skipping auth for path:", req.path);
        next();
        return;
    }

    let token;

    // 1. FIRST check for Bearer token in Authorization header (from React)
    const authHeader = req.headers.authorization;
    console.log("📦 Authorization Header:", authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log("✅ Using Bearer token from Authorization header");
        console.log("🔑 Token (first 30 chars):", token.substring(0, 30) + "...");
    } 
    // 2. Then check for signed cookie (fallback)
    else if (req?.signedCookies?.unique_jwt_token) {
        token = req.signedCookies.unique_jwt_token;
        console.log("✅ Using token from signed cookie");
    }
    // 3. Then check regular cookies
    else if (req?.cookies?.unique_jwt_token) {
        token = req.cookies.unique_jwt_token;
        console.log("✅ Using token from regular cookie");
    }
    // 4. Then check body/query/params
    else {
        token = req?.body?.unique_jwt_token ||
                req?.query?.unique_jwt_token ||
                req?.params?.unique_jwt_token;
        
        if (token) {
            console.log("✅ Using token from body/query/params");
        }
    }

    if (!token) {
        console.log("❌ No token found in any source");
        return res.status(401).json({ 
            success: false, 
            msg: 'No authentication token provided',
            debug: {
                authHeader: !!authHeader,
                signedCookie: !!req?.signedCookies?.unique_jwt_token,
                regularCookie: !!req?.cookies?.unique_jwt_token
            }
        });
    }

    console.log("🔑 Token found, processing...");

    // Clean token if needed (for cookies)
    try {
        // URL decode if necessary
        if (token.includes('%3A') || token.includes('%')) {
            token = decodeURIComponent(token);
            console.log("🔧 URL decoded token");
        }

        // Remove 's:' prefix if present (from signed cookies)
        if (token.startsWith("s:")) {
            token = token.substring(2);
            console.log("🔧 Removed 's:' prefix");
        }

        // Ensure valid JWT format
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('❌ Invalid JWT format');
            return res.status(401).json({ 
                success: false, 
                msg: "Invalid token format",
                tokenPreview: token.substring(0, 50)
            });
        }
        
    } catch (error) {
        console.error('❌ Error processing token:', error);
        return res.status(401).json({ 
            success: false, 
            msg: "Invalid token format"
        });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err || !decoded) {
            console.error('❌ JWT verification error:', err?.message);
            return res.status(401).json({ 
                success: false, 
                msg: "Invalid or expired token",
                error: err?.message
            });
        }

        console.log("✅ JWT verified successfully");
        console.log("📋 Decoded payload:", decoded);

        // Check for admin
        if (decoded.admin?._id) {
            console.log("👤 Admin token verified");
            const admin = await admin_module.findById(decoded.admin._id);
            
            if (!admin) {
                console.log("❌ Admin not found in DB");
                return res.status(401).json({ 
                    success: false, 
                    msg: "Admin account not found"
                });
            }
            
            console.log("✅ Admin found:", admin.username);
            req.admin = admin;
            return next();
        }

        // Check for user (mobile) - optional
        if (decoded.user) {
            const user = await user_module.findById(decoded.user);
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    msg: "User not found"
                });
            }
            
            if (decoded?.device_id !== user?.device_id) {
                return res.status(400).json({ 
                    success: false, 
                    msg: "Already loggedIn other device, Relogin here for log out other device!", 
                    status: 0 
                });
            }

            req.user = user;
            return next();
        }

        console.error('❌ Invalid token structure:', decoded);
        return res.status(401).json({ 
            success: false, 
            msg: "Invalid token structure"
        });
    });
}

module.exports = { jwt_check_middleware };










// // middlewares/jwt_check_middleware.js - COMPLETE VERSION
// const jwt = require('jsonwebtoken');
// const user_module = require('../model/userModel');
// const admin_module = require('../model/admin_module');

// const jwt_check_middleware = async (req, res, next) => {
//     console.log(" req.body-", req.body)
    
//     // Debug: Log all cookies
//     console.log("📦 Signed Cookies:", req.signedCookies);
//     console.log("📦 Regular Cookies:", req.cookies);
//     console.log("📦 Path:", req.path);

//     // Skip auth for these paths
//     if (
//         req.path === "/api-check-mobile" ||
//         req.path === '/api-user-registration' ||
//         req.path === '/api-user-status' ||
//         req.path === '/api-user-login' ||
//         req.path === '/admin/loginCheck' ||
//         req.path === '/api/get-services'
//     ) {
//         next();
//         return;
//     }

//     let token;

//     if (req.path.includes('/api')) {
//         console.log("--------------path check in mobile API----------", req.path)
//         token = req?.body?.unique_jwt_token || req?.query?.unique_jwt_token;
//     } else {
//         console.log("--------------path check in Admin API----------", req.path)
        
//         // 🔴 FIX HERE: For ADMIN routes, use signedCookies (cookie-parser removes 's:' prefix)
//         token = req?.signedCookies?.unique_jwt_token;
        
//         // If not in signedCookies, check other places
//         if (!token) {
//             // Check if we need to manually decode
//             const rawCookie = req?.cookies?.unique_jwt_token;
//             if (rawCookie) {
//                 console.log("Found raw cookie, checking if signed:", rawCookie);
//                 // If it starts with 's:' or 's%3A', it's a signed cookie that wasn't parsed
//                 if (rawCookie.startsWith("s:") || rawCookie.includes("s%3A")) {
//                     console.log("⚠️ Cookie is signed but not parsed - check cookie-parser configuration");
//                 }
//             }
            
//             token = rawCookie || 
//                    req?.body?.unique_jwt_token ||
//                    req?.query?.unique_jwt_token ||
//                    req?.params?.unique_jwt_token;
//         }
//     }

//     if (!token) {
//         console.log("❌ No token found");
//         return res.status(401).json({ success: false, jwt_error_msg: 'No token provided' });
//     }

//     // Debug token
//     console.log("🔑 Token found (first 50 chars):", token.substring(0, 50));

//     // Clean token: Remove any remaining 's:' prefix or URL encoding
//     try {
//         // URL decode if necessary
//         if (token.includes('%3A') || token.includes('%')) {
//             token = decodeURIComponent(token);
//             console.log("🔧 URL decoded token:", token.substring(0, 30) + "...");
//         }

//         // Remove 's:' prefix if present (shouldn't be if cookie-parser worked)
//         if (token.startsWith("s:")) {
//             token = token.substring(2);
//             console.log("🔧 Removed 's:' prefix");
//         }

//         // Ensure valid JWT format
//         const parts = token.split('.');
//         if (parts.length < 3) {
//             console.error('Invalid JWT format:', token);
//             return res.status(401).json({ success: false, jwt_error_msg: "Invalid token format" });
//         }
        
//         // Reconstruct token from first 3 parts
//         token = parts.slice(0, 3).join('.');
        
//     } catch (error) {
//         console.error('Error processing token:', error);
//         return res.status(401).json({ success: false, jwt_error_msg: "Invalid token format" });
//     }

//     // Verify token
//     jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
//         if (err || !decoded) {
//             console.error('❌ JWT verification error:', err?.message);
//             return res.status(401).json({ success: false, jwt_error_msg: "Invalid token" });
//         }

//         // Check for admin
//         if (decoded.admin?._id) {
//             console.log("✅ Admin token verified:", decoded.admin);
//             const admin = await admin_module.findById(decoded.admin._id);
//             if (!admin) {
//                 console.log("❌ Admin not found in DB");
//                 return res.status(401).json({ success: false, jwt_error_msg: "Admin not found" });
//             }
            
//             console.log("✅ Admin found, attaching to request");
//             req.admin = admin;
//             return next();
//         }

//         // Check for user (mobile)
//         if (decoded.user) {
//             const user = await user_module.findById(decoded.user);
//             if (!user) {
//                 return res.status(401).json({ success: false, jwt_error_msg: "User not found" });
//             }
            
//             if (decoded?.device_id !== user?.device_id) {
//                 return res.status(400).json({ 
//                     success: false, 
//                     msg: "Already loggedIn other device, Relogin here for log out other device!", 
//                     status: 0 
//                 });
//             }

//             req.user = user;
//             return next();
//         }

//         console.error('❌ Invalid token structure:', decoded);
//         return res.status(401).json({ success: false, jwt_error_msg: "Invalid token structure" });
//     });
// }

// // EXPORT THE FUNCTION
// module.exports = { jwt_check_middleware };