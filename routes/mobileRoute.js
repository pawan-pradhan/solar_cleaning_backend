const express = require('express');
const router = express();
const fs = require('fs');

require("dotenv").config();

const {
    apiCheckMobile,
    apiCheckUsername,
    apiUserRegistration,
    apiUserStatus,
    apiUserLogin,
    checkToken,

} = require('../controllers/mobileController');
const mobileController = require('../controllers/mobileController');
// const { exitToLobby } = require('../utils/connectPlayer');




router.get('/', (req, res) => res.send('Mobile API is working!'));

router.post('/api-check-login-token', checkToken);
router.post('/api-check-mobile', apiCheckMobile);
router.post('/api-check-username', apiCheckUsername);
router.post('/api-user-registration', apiUserRegistration);
router.post('/api-user-status', apiUserStatus);
router.post('/api-user-login', apiUserLogin);




// Add these routes after your existing routes

// Service routes
router.post('/api/get-services', mobileController.apiGetServices);

// Order routes
router.post('/api/user-orders', mobileController.apiGetUserOrders);
router.post('/api/create-order', mobileController.apiCreateOrder);
router.post('/api/order/:orderId', mobileController.apiGetOrderDetails);
router.post('/api/cancel-order/:orderId', mobileController.apiCancelOrder);

// Profile routes
router.post('/user-profile', mobileController.apiGetUserProfile);
router.post('/update-profile', mobileController.apiUpdateProfile);


module.exports = router;