const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require('bcryptjs'); // Change from 'bcrypt' to 'bcryptjs'
const jwt = require('jsonwebtoken');
const moment_timeZone = require('moment-timezone');


// const {
//     toStr,
//     capitalizeWords,
//     getUserRandomToken,
//     getOtp,
//     formatTime12Hour,
//     convert12To24,
//     convert24To12,
//     noticeSender
// } = require('../helper/helper_functions');

// db modules
const user_module = require('../model/userModel');
const admin_module = require('../model/admin_module');


const isAlreadyLogin = async (req, res) => {
    try {
        let admin = req?.admin || {}
        console.log("🚀 ~ isAlreadyLogin ~ admin:", admin)
        console.log("🚀 ~ isAlreadyLogin ~ admin?.accessMenus[0]:", admin?.accessMenus[0])
        return res.json({
            success: true,
            msg: "You already login",
            redirectRoute: '/dashboard',
            adminAccess: admin?.accessMenus,
            admin_user_name: req.admin ? req?.admin?.username : '',
            admin_type: req.admin ? req?.admin?.admin_type : '',
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, msg: "Server error" });
    }
};

const loginCheck = async (req, res) => {
    try {
        console.log('🔐 Login attempt:', req.body);
        
        if (!process?.env?.JWT_SECRET) {
            console.error('❌ JWT_SECRET not configured');
            return res.status(500).json({ 
                success: false, 
                msg: "JWT secret not found" 
            });
        }

        let { email = '', password = '' } = req.body || {};
        email = email.trim();
        password = password.trim();

        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({
                success: false,
                msg: "Email and password are required."
            });
        }

        console.log('🔍 Searching for admin with email:', email);
        const user = await admin_module.findOne({ admin_email: email });
        console.log("🚀 ~ loginCheck ~ user found:", user);
        
        if (!user) {
            console.log('❌ No admin found with email:', email);
            // Also check what emails exist
            const allAdmins = await admin_module.find({}, 'admin_email username');
            console.log('Available admins:', allAdmins.map(a => ({ email: a.admin_email, username: a.username })));
            
            return res.status(401).json({
                success: false,
                msg: "Invalid email or password."
            });
        }

        console.log('🔑 Comparing password...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            console.log('❌ Password incorrect for:', email);
            return res.status(401).json({
                success: false,
                msg: "Invalid email or password."
            });
        }

        console.log('✅ Login successful, generating token...');
        
        // Create token with minimal payload
        const tokenPayload = {
            admin: {
                _id: user._id,
                username: user.username,
                admin_email: user.admin_email,
                admin_type: user.admin_type
            }
        };

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ Token generated:', token.substring(0, 20) + '...');

        // Set cookie
        res.cookie("unique_jwt_token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            signed: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return res.status(200).json({
            success: true,
            testToken: token,
            msg: "Login successful.",
            redirectRoute: '/dashboard',
            admin_user_name: user.username,
            admin_type: user.admin_type,
            adminAccess: user.accessMenus || []
        });

    } catch (err) {
        console.error("🔥 Login error:", err);
        return res.status(500).json({ 
            success: false, 
            msg: "Internal server error.",
            error: err.message // Include error in development
        });
    }
};





module.exports = {
    loginCheck,
    isAlreadyLogin
}
