#!/usr/bin/env node
require('dotenv').config();
require('ts-node/register');

console.log('Starting user data migration process...');
console.log('Using MongoDB URI:', process.env.MONGODB_URI || 'No URI provided!');

const migrateUserData = require('./src/scripts/migrateUserData').default;

migrateUserData()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }); 