const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const moment_timeZone = require('moment-timezone');
const { toStr, checkRequestAuth, getUserRandomToken } = require('../helper/helper_functions');




// db modules
const user_module = require('../model/userModel');
const contact_settings_module = require('../model/contact_settings_module');
const admin_module = require('../model/admin_module');

const Service = require('../model/serviceModel');
const Order = require('../model/orderModel');




// middleware not used for JWT token
const apiCheckMobile = async (req, res) => {
    try {
        let { mobile = "", app_key = "", env_type = "" } = req?.body || {};
        app_key = toStr(app_key)
        env_type = toStr(env_type)

        if (!app_key || !env_type || !mobile) {
            return res
                .status(400)
                .json({ success: false, msg: 'All fields are required.' });
        }

        if (!checkRequestAuth(app_key, env_type)) {
            return res
                .status(401)
                .json({ success: false, msg: 'Unauthorized request.' });
        }

        mobile = Number(toStr(mobile));

        if (!mobile) {
            return res.status(400).json({ success: false, msg: 'Mobile number is required.' });
        }

        const mobileRegex = /^\d{10}$/;

        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ success: false, msg: 'Invalid mobile number. Must be exactly 10 digits.' });
        }

        let userData = await user_module.findOne({ mobile }).lean();

        if (userData) {
            return res.json({
                success: false,
                msg: 'Mobile number is already registered. Try Login.',
            });
        } else {
            return res.json({
                success: true,
                msg: 'Mobile number is not registered.',
            });
        }

    } catch (err) {
        console.error('Error in apiCheckMobile:', err.message || err);
        return res.status(500).json({
            success: false,
            msg: 'Internal Server Error',
        });
    }
};

// middleware not used for JWT token
const apiCheckUsername = async (req, res) => {
    try {
        const username = toStr(req?.body?.username || '').toLowerCase();
        if (!username) {
            return res
                .status(400)
                .json({ success: false, msg: 'Username is required.' });
        }

        let usernameIsExist = await user_module.findOne({ user_name: username })
        if (usernameIsExist) {
            return res.json({
                success: false,
                msg: 'Username is already registered. Try login.'
            });
        }

        return res.json({
            success: true,
            msg: 'Username is not registered.'
        });
    } catch (err) {
        console.error('Error in apiCheckUsername:', err);
        return res
            .status(500)
            .json({ success: false, msg: 'Internal Server Error' });
    }
};

const apiUserRegistration = async (req, res) => {

    try {
        if (!process?.env?.JWT_SECRET) {
            return res.status(500).json({ success: false, msg: "JWT secret not found" });
        }

            let {
                username = "",
                email = "",
                mobile = "",
                password = "",
            } = req?.body || {};

            username = toStr(username);
            mobile = toStr(mobile);
            password = toStr(password);
            email = toStr(email);

            // Validation checks with consistent response pattern
            if ( !username || !email || !mobile || !password ) {
                throw new Error("All fields are required.");
            }

            const mobileRegex = /^\d{10}$/;

            if (password.length < 6) {
                throw new Error("Password must be 6 characters.");
            }

            if (!mobileRegex.test(mobile)) {
                throw new Error("Invalid mobile. Must be 10 digits.");
            }

            const mobileNum = Number(mobile);
            const exists = await user_module
                .findOne({ $or: [{ mobile: mobileNum }, { email }] })
                .lean();

                console.log(`(((((((()))))) ~ mobileController.js:246 ~ apiUserRegistration ~ exists:`, exists);

            if (exists) {
                throw new Error("Mobile or username already registered.");
            }

            const my_code = getUserRandomToken(8, true);

            // Hash password before storing
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUserData = {
                user_name: username,
                mobile: mobileNum,
                password: hashedPassword,
                my_code,
                email
            };

            const createdUser = await user_module.create([newUserData]);

            const created = createdUser?.[0];

            return res.json({
                success: true,
                user_name: created.user_name,
                mobile: created.mobile,
                msg: 'You are successfully registered.'
            });

    } catch (error) {
        console.error('Error in apiUserRegistration:', error);

        // Check if headers have already been sent
        if (res.headersSent) {
            console.log('Headers already sent, cannot send error response');
            return;
        }

        console.log("jkjkjk", req.body)
        return res.status(500).json({
            success: false,
            msg: error?.message || 'Internal Server Error'
        });
    } 
};


// middleware not used for JWT token
const apiUserStatus = async (req, res) => {
    try {
        let { app_key = "", env_type = "", userDB_id = "" } = req?.body || {};
        app_key = toStr(app_key);
        env_type = toStr(env_type);
        userDB_id = toStr(userDB_id);

        if (!app_key || !env_type || !userDB_id) {
            return res
                .status(400)
                .json({
                    success: false,
                    msg: 'All fields are required.'
                });
        }

        if (!checkRequestAuth(app_key, env_type)) {
            return res
                .status(401)
                .json({ success: false, msg: 'Unauthorized request.' });
        }

        const user = await user_module
            .findById(userDB_id)
            .lean();
        if (!user) {
            return res
                .status(404)
                .json({
                    success: false,
                    msg: 'User ID is not valid.'
                });
        }

        const isActive =
            user.status > 0 &&
            user.betting_status === 1 &&
            user.wallet_balance > 0;

        return res.json({
            success: true,
            user_status: isActive,
            msg: 'Get User Status.'
        });
    } catch (error) {
        console.error('apiUserStatus error:', error);
        return res
            .status(500)
            .json({ success: false, msg: 'Internal Server Error' });
    }
};

// middleware not used for JWT token
const apiUserLogin = async (req, res) => {
    try {
        if (!process?.env?.JWT_SECRET) {
            return res.status(500).json({ success: false, msg: "JWT secret not found" });
        }
        let {  mobile = "", password = "" } = req?.body || {};
        mobile = Number(toStr(mobile));
        inputPassword = toStr(password);


        // if (!app_key || !env_type || !mobile || !device_id) {
        if (!password ||!mobile) {
            return res
                .status(400)
                .json({ success: false, msg: 'All fields are required.' });
        }

       

        const mobileRegex = /^\d{10}$/;
        // const passwordRegex = /^.{8,}$/;
        if (!mobileRegex.test(mobile)) {
            return res
                .status(400)
                .json({ success: false, msg: 'Invalid mobile. Must be 10 digits.' });
        }
      
        if (password.length < 6) {
            return res
                .status(400)
                .json({ success: false, msg: 'Password must be 6 characters.' });
        }

        const mobileNum = Number(mobile);
        const user = await user_module.findOne({ mobile: mobileNum });

        // console.log(`(((((((()))))) ~ mobileController.js:885 ~ apiUserLogin ~ user:`, user);

        if (!user) {
            return res.status(404).json({ success: false, msg: 'Mobile not found.' });
        }

        const {
            _id,
            user_name,
            betting_status,
            status,
            other_notification_status,
            main_game_notification_status,
            gali_disswar_game_notification_status,
            starline_game_notification_status,
        } = user;

        if (status === 0) {
            return res.json({ success: false, msg: 'Account blocked. Contact admin.' });
        }

        const hash = user.password;

        user.last_update = new Date()

        const match = await bcrypt.compare(inputPassword, hash);

        // console.log(`(((((((()))))) ~ mobileController.js:909 ~ apiUserLogin ~ match:`, match);
        if (!match) {
            return res.status(401).json({ success: false, msg: 'Invalid login details.' });
        }

        const settings = await contact_settings_module
            .findOne()
            .lean();

        const mobile_no = settings?.whatsapp_no || '';

        if (!mongoose.isValidObjectId(_id)) {
            return res.status(400).json({ success: false, msg: "Invalid ID" });
        }

        // await user_device_record_module.updateOne(
        //     { userDB_id: _id, device_id },
        //     { $set: { userDB_id: _id, device_id } },
        //     { upsert: true }
        // );

        // const unique_jwt_token = jwt.sign(
        //     { user: user._id },
        //     process?.env?.JWT_SECRET,
        // );

        const unique_jwt_token = jwt.sign(
            {
                user: user._id,
            },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }   // optional, but recommended
        );

        // user.unique_jwt_token = unique_jwt_token
        // 
        user.logout_status = 0;
        await user.save();

        return res.json({
            success: true,
            msg: 'Login successful.',
            unique_jwt_token,
            user_name,
            mobile: mobileNum.toString(),

            other_notification_status: `${other_notification_status}`,
            main_game_notification_status: `${main_game_notification_status}`,
            gali_disswar_game_notification_status: `${gali_disswar_game_notification_status}`,
            starline_game_notification_status: `${starline_game_notification_status}`,

            mobile_no: mobile_no.toString(),
            betting_status: betting_status.toString()
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res
            .status(500)
            .json({ success: false, msg: 'Internal Server Error' });
    }
};


// middleware & jwt token required 
const checkToken = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ status: false, message: "Unauthorized" });
        }

        // remove password/hash before sending
        const userData = req.user.toObject();
        delete userData.password;

        return res.status(200).json({
            status: true,
            message: "Token Verified, Auto login successful",
            data: userData,
        });
    } catch (err) {
        console.error("Internal server error", err);
        return res.status(500).json({ status: false, message: "Internal Server Error" });

    }


};


// --------------------------------------------------------

// Get all active services
const apiGetServices = async (req, res) => {
    try {
        const services = await Service.find({ isActive: true })
            .select('name description basePrice duration category imageUrl features')
            .lean();

        res.json({
            success: true,
            services,
            message: 'Services retrieved successfully'
        });
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get user's orders
const apiGetUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;

        const filter = { userId };
        
        if (status && status !== 'all') {
            filter.status = status;
        }

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .select('orderId serviceName status totalAmount scheduledDate timeSlot createdAt')
            .lean();

        // Calculate statistics
        const stats = await Order.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        res.json({
            success: true,
            orders,
            stats,
            message: 'Orders retrieved successfully'
        });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create new order
const apiCreateOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            serviceId,
            scheduledDate,
            timeSlot,
            notes,
            paymentMethod
        } = req.body;

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Validate required fields
        if (!serviceId || !scheduledDate || !timeSlot) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields (serviceId, scheduledDate, timeSlot)' 
            });
        }

        // Get service details
        const service = await Service.findById(serviceId);
        if (!service || !service.isActive) {
            return res.status(404).json({ 
                success: false, 
                message: 'Service not found or inactive' 
            });
        }

        // Check if scheduled date is in future
        const selectedDate = new Date(scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot book for past dates' 
            });
        }

        // Create order
        const order = new Order({
            userId,
            userName: user.user_name,
            userEmail: user.email || `${user.user_name}@example.com`,
            userPhone: user.mobile,
            userAddress: user.address ? 
                `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.zipCode}` : 
                'Address not provided',
            serviceId,
            serviceName: service.name,
            servicePrice: service.basePrice,
            totalAmount: service.basePrice,
            scheduledDate: selectedDate,
            timeSlot,
            notes: notes || '',
            paymentMethod: paymentMethod || 'cash'
        });

        await order.save();

        // Update service booking count
        service.totalBookings += 1;
        await service.save();

        // Send notification (you can integrate with your notification system)
        // await sendOrderConfirmation(user, order);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: {
                orderId: order.orderId,
                serviceName: order.serviceName,
                totalAmount: order.totalAmount,
                scheduledDate: order.scheduledDate,
                timeSlot: order.timeSlot,
                status: order.status,
                createdAt: order.createdAt
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get order details
const apiGetOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ orderId, userId })
            .populate('serviceId', 'name description basePrice duration')
            .lean();

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        res.json({
            success: true,
            order,
            message: 'Order details retrieved'
        });
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Cancel order
const apiCancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ orderId, userId, status: { $in: ['pending', 'confirmed'] } });

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found or cannot be cancelled' 
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// User profile
const apiGetUserProfile = async (req, res) => {
    try {
        const user = req.user;
        
        // Get user stats
        const orderStats = await Order.aggregate([
            { $match: { userId: user._id } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' },
                    pendingOrders: { 
                        $sum: { 
                            $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] 
                        }
                    },
                    completedOrders: { 
                        $sum: { 
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] 
                        }
                    }
                }
            }
        ]);

        const stats = orderStats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            pendingOrders: 0,
            completedOrders: 0
        };

        res.json({
            success: true,
            user: {
                user_name: user.user_name,
                mobile: user.mobile,
                email: user.email,
                wallet_balance: user.wallet_balance,
                address: user.address,
                created_at: user.created_at
            },
            stats,
            message: 'Profile retrieved successfully'
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update user profile
const apiUpdateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { email, address } = req.body;

        const updateData = {};
        
        if (email) {
            updateData.email = email;
        }
        
        if (address) {
            updateData.address = {
                street: address.street || req.user.address?.street,
                city: address.city || req.user.address?.city,
                state: address.state || req.user.address?.state,
                zipCode: address.zipCode || req.user.address?.zipCode
            };
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, select: '-password' }
        );

        res.json({
            success: true,
            user: updatedUser,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



module.exports = {
    checkToken,
    apiCheckMobile,
    apiCheckUsername,
    apiUserRegistration,
    apiUserStatus,
    apiUserLogin,

    apiGetServices,
    apiGetUserOrders,
    apiCreateOrder,
    apiGetOrderDetails,
    apiCancelOrder,
    apiGetUserProfile,
    apiUpdateProfile,
};