const express = require('express');
const router = express();
const multer = require('multer');
const fs = require('fs');
const path = require('path');



const {
    isAlreadyLogin,
    loginCheck

} = require('../controllers/adminController');


// get methods
router.get('/admin', isAlreadyLogin);  // adminCheckApi

router.post('/admin/loginCheck', loginCheck);

module.exports = router;