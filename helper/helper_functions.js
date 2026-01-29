const axios = require('axios');
const crypto = require('crypto');
const moment_timeZone = require('moment-timezone');
require('dotenv').config();

// db models

function toStr(v) {
    if (typeof v === 'number' && v < 0) {
        return '';
    }
    return v ? String(v).trim() : '';
}

function checkRequestAuth(app_key, env_type) {
    console.log("called 1");
    let db_app_key = '';
    
    if (env_type === 1 || env_type === '1') {
        console.log("called 2");
        db_app_key = process.env.APP_KEY;
        console.log("called 2.1", db_app_key);
    }
    
    if (app_key === 'Prod') {
        console.log("called 3");
        db_app_key = process.env.PRODUCTION_APP_KEY_APP + process.env.PRODUCTION_APP_KEY_SERVER;
        console.log("called 3.1", db_app_key);
        // You can also hardcode this line if needed:
        // db_app_key = 'SgRTXsywVmWteEBLlYWecwgbDiHwlh';
    }
    
    if (db_app_key === app_key && app_key !== '') {
        console.log("called 4", (db_app_key === app_key && app_key !== ''));
        return 1;
    } else {
        return 0;
    }
}

function getUserRandomToken(n = Math.floor(Math.random() * 6) + 5, numberOnly = false) {
    let i = 1
    console.log("called", i);
    i++;
    const characters = numberOnly
        ? '0123456789'
        : '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    let randomString = '';
    for (let i = 0; i < n; i++) {
        const index = Math.floor(Math.random() * characters.length);
        randomString += characters[index];
    }
    return randomString;
}


module.exports = {
    toStr,
    checkRequestAuth,
    getUserRandomToken
}