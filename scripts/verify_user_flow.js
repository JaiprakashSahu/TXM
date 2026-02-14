// const axios = require('axios'); // Removed to use fetch


const API_URL = 'http://localhost:3001/api';

async function runTest() {
    try {
        console.log('--- ITILITE Lite User Flow Test ---\n');

        // 1. Login as Admin
        console.log('1. Logging in as Admin...');
        const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: process.env.ADMIN_EMAIL || 'admin@test.com',
                password: process.env.ADMIN_PASSWORD || 'password123',
            }),
        });
        const adminLogin = await adminLoginRes.json();
        if (!adminLogin.success) throw new Error(adminLogin.message);
        const adminToken = adminLogin.data.accessToken;
        console.log('✅ Admin logged in. Token acquired.\n');

        // 2. Create New User
        const newEmail = `testuser_${Date.now()}@test.com`;
        console.log(`2. Creating new user (${newEmail})...`);
        const createUserResRaw = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: 'Test Employee',
                email: newEmail,
                role: 'employee',
            }),
        });
        const createUserRes = await createUserResRaw.json();
        if (!createUserRes.success) throw new Error(createUserRes.message);

        console.log('✅ User created.');
        const tempPassword = createUserRes.data.tempPassword;
        console.log(`ℹ️ Temporary Password: ${tempPassword}\n`);

        // 3. Login as New User
        console.log('3. Logging in as New User...');
        const userLoginResRaw = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: newEmail,
                password: tempPassword,
            }),
        });
        const userLogin = await userLoginResRaw.json();
        if (!userLogin.success) throw new Error(userLogin.message);

        const userToken = userLogin.data.accessToken;
        const mustChangePassword = userLogin.data.user.mustChangePassword;

        if (mustChangePassword !== true) {
            console.error('❌ mustChangePassword should be true!');
            // return; // Don't return, let's try to proceed or throw
            throw new Error('mustChangePassword check failed');
        }
        console.log('✅ User logged in. mustChangePassword is YES.\n');

        // 4. Change Password
        // 3.5 Verify Blocked Access
        console.log('3.5 Verifying Blocked Access (Should fail with 403)...');
        const profileResRaw = await fetch(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (profileResRaw.status === 403) {
            console.log('✅ Access blocked correctly (403 Forbidden).\n');
        } else {
            console.error(`❌ Access NOT blocked! Status: ${profileResRaw.status}`);
            throw new Error('Security check failed: User could access profile without changing password.');
        }

        // 4. Change Password
        console.log('4. Changing Password...');
        const newPassword = 'NewSecurePassword123!';
        const changePwdResRaw = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userToken}`
            },
            body: JSON.stringify({
                oldPassword: tempPassword,
                newPassword: newPassword,
            }),
        });
        // check status or json
        if (!changePwdResRaw.ok) {
            const err = await changePwdResRaw.json();
            throw new Error(err.message || 'Change password failed');
        }
        console.log('✅ Password changed successfully.\n');

        // 5. Login with New Password
        console.log('5. verifying Login with New Password...');
        const finalLoginRaw = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: newEmail,
                password: newPassword,
            }),
        });
        const finalLogin = await finalLoginRaw.json();
        if (!finalLogin.success) throw new Error(finalLogin.message);

        if (finalLogin.data.user.mustChangePassword === false) {
            console.log('✅ Final login successful. mustChangePassword is NO.');
        } else {
            console.error('❌ mustChangePassword should be false!');
        }

        console.log('\n--- Test Completed Successfully ---');
    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
    }
}

runTest();
