const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function runTest() {
    try {
        console.log('--- ITILITE Lite User Flow Test ---\n');

        // 1. Login as Admin
        console.log('1. Logging in as Admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'password123',
        });
        const adminToken = adminLogin.data.data.accessToken;
        console.log('✅ Admin logged in. Token acquired.\n');

        // 2. Create New User
        const newEmail = `testuser_${Date.now()}@test.com`;
        console.log(`2. Creating new user (${newEmail})...`);
        const createUserRes = await axios.post(
            `${API_URL}/users`,
            {
                name: 'Test Employee',
                email: newEmail,
                role: 'employee',
            },
            {
                headers: { Authorization: `Bearer ${adminToken}` },
            }
        );
        console.log('✅ User created.');
        const tempPassword = createUserRes.data.data.tempPassword;
        console.log(`ℹ️ Temporary Password: ${tempPassword}\n`);

        // 3. Login as New User
        console.log('3. Logging in as New User...');
        const userLogin = await axios.post(`${API_URL}/auth/login`, {
            email: newEmail,
            password: tempPassword,
        });
        const userToken = userLogin.data.data.accessToken;
        const mustChangePassword = userLogin.data.data.user.mustChangePassword;

        if (mustChangePassword !== true) {
            console.error('❌ mustChangePassword should be true!');
            return;
        }
        console.log('✅ User logged in. mustChangePassword is YES.\n');

        // 4. Change Password
        console.log('4. Changing Password...');
        const newPassword = 'NewSecurePassword123!';
        await axios.post(
            `${API_URL}/auth/change-password`,
            {
                oldPassword: tempPassword,
                newPassword: newPassword,
            },
            {
                headers: { Authorization: `Bearer ${userToken}` },
            }
        );
        console.log('✅ Password changed successfully.\n');

        // 5. Login with New Password
        console.log('5. verifying Login with New Password...');
        const finalLogin = await axios.post(`${API_URL}/auth/login`, {
            email: newEmail,
            password: newPassword,
        });

        if (finalLogin.data.data.user.mustChangePassword === false) {
            console.log('✅ Final login successful. mustChangePassword is NO.');
        } else {
            console.error('❌ mustChangePassword should be false!');
        }

        console.log('\n--- Test Completed Successfully ---');
    } catch (error) {
        console.error('\n❌ Test Failed:', error.response ? error.response.data : error.message);
    }
}

runTest();
