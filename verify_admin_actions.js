require('dotenv').config();

const API_BASE = 'http://localhost:3001/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'StrongPassword123!';

async function verifyActions() {
    let adminToken = '';
    let testUserId = '';

    try {
        console.log('--- 1. Login as Admin ---');
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok) throw new Error(`Login failed: ${loginData.message}`);

        adminToken = loginData.data.accessToken;
        const adminId = loginData.data.user.id;
        console.log('Admin logged in.');

        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        };

        console.log('\n--- 2. Create Test User ---');
        const createRes = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                name: 'Test Target',
                email: `target_${Date.now()}@test.com`,
                role: 'employee'
            })
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(`Create failed: ${createData.message}`);

        testUserId = createData.data.user.id;
        const tempPassword = createData.data.tempPassword;
        const testUserEmail = createData.data.user.email;
        console.log(`Test user created: ${testUserId}`);

        console.log('\n--- 3. Verify Self-Protection (Deactivate Self) ---');
        const deactSelfRes = await fetch(`${API_BASE}/users/${adminId}/deactivate`, {
            method: 'PATCH',
            headers: authHeaders
        });
        const deactSelfData = await deactSelfRes.json();
        if (deactSelfRes.ok) {
            console.error('FAIL: Admin deactivated themselves!');
        } else {
            console.log(`SUCCESS: Expected error - ${deactSelfData.message}`);
        }

        console.log('\n--- 4. Verify Self-Protection (Change Own Role) ---');
        const roleSelfRes = await fetch(`${API_BASE}/users/${adminId}/role`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({ role: 'manager' })
        });
        const roleSelfData = await roleSelfRes.json();
        if (roleSelfRes.ok) {
            console.error('FAIL: Admin changed their own role!');
        } else {
            console.log(`SUCCESS: Expected error - ${roleSelfData.message}`);
        }

        console.log('\n--- 5. Verify Deactivation Flow ---');
        const deactRes = await fetch(`${API_BASE}/users/${testUserId}/deactivate`, {
            method: 'PATCH',
            headers: authHeaders
        });
        if (deactRes.ok) {
            console.log('Test user deactivated.');
        } else {
            const data = await deactRes.json();
            console.error(`FAIL: Could not deactivate user - ${data.message}`);
        }

        console.log('\n--- 6. Verify Deactivated Login Rejection ---');
        const loginDeactRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUserEmail, password: tempPassword })
        });
        const loginDeactData = await loginDeactRes.json();
        if (loginDeactRes.ok) {
            console.error('FAIL: Deactivated user logged in!');
        } else {
            console.log(`SUCCESS: Expected 403 - ${loginDeactData.message}`);
        }

        console.log('\n--- 7. Verify Password Reset ---');
        const resetRes = await fetch(`${API_BASE}/users/${testUserId}/reset-password`, {
            method: 'POST',
            headers: authHeaders
        });
        const resetData = await resetRes.json();
        if (resetRes.ok) {
            console.log(`Password reset success. New temp: ${resetData.temporaryPassword}`);
        } else {
            console.error(`FAIL: Password reset failed - ${resetData.message}`);
        }

        console.log('\n--- ALL VERIFICATIONS COMPLETE ---');
    } catch (error) {
        console.error('Verification failed:', error.message);
    }
}

verifyActions();
