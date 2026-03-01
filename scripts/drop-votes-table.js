'use strict';

require('dotenv').config();
const { sequelize } = require('../models');

(async () => {
    try {
        await sequelize.authenticate({ logging: false });
        console.log('✅ Connected to database.');

        await sequelize.query('DROP TABLE IF EXISTS votes CASCADE;');
        console.log('✅ votes table dropped successfully.');
    } catch (err) {
        console.error('❌ Error dropping votes table:', err.message);
    } finally {
        await sequelize.close();
    }
})();
