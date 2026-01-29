const axios = require('axios');
const crypto = require('crypto');
const moment_timeZone = require('moment-timezone');

// db models

function toStr(v) {
    if (typeof v === 'number' && v < 0) {
        return '';
    }
    return v ? String(v).trim() : '';
}

function checkRequestAuth(app_key, env_type) {
    let db_app_key = '';

    if (env_type === 1 || env_type === '1') {
        db_app_key = process.env.APP_KEY;
    }

    if (env_type === 'Prod') {
        db_app_key = process.env.PRODUCTION_APP_KEY_APP + process.env.PRODUCTION_APP_KEY_SERVER;
        // You can also hardcode this line if needed:
        // db_app_key = 'SgRTXsywVmWteEBLlYWecwgbDiHwlh';
    }

    if (db_app_key === app_key && app_key !== '') {
        return 1;
    } else {
        return 0;
    }
}


module.exports = {
    toStr,
    checkRequestAuth,
}