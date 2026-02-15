require('dotenv').config();

const API_BASE = 'http://localhost:3001/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'StrongPassword123!';

async function verifyAll() {
    let adminToken = '';
    let adminId = '';
    let testUserId = '';

    try {
        console.log('--- 1. Login as Admin ---');
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        adminToken = loginData.data.accessToken;
        adminId = loginData.data.user.id;
        console.log(`Admin logged in: ${adminId}`);

        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        };

        console.log('\n--- 2. Verify Admin Hierarchy (Demote Another Admin via seed) ---');
        // First, check how many admins exist
        const usersRes = await fetch(`${API_BASE}/users`, { headers: authHeaders });
        const usersData = await usersRes.json();
        const admins = usersData.data.filter(u => u.role === 'admin' && u.isActive);
        console.log(`Current active admins: ${admins.length}`);

        if (admins.length === 1) {
            console.log('Testing "Last Admin" protection...');
            const deactRes = await fetch(`${API_BASE}/users/${adminId}/deactivate`, {
                method: 'PATCH',
                headers: authHeaders
            });
            const deactData = await deactRes.json();
            if (!deactRes.ok && deactData.message.includes('last remaining admin')) {
                console.log(`SUCCESS: Last admin protection triggered - ${deactData.message}`);
            } else {
                console.error(`FAIL: Expected last admin protection. Got: ${deactData.message}`);
            }
        }

        console.log('\n--- 3. Verify Deactivation & Login Block ---');
        // Create a temp user
        const createRes = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ name: 'Deact Test', email: `deact_${Date.now()}@test.com`, role: 'employee' })
        });
        const createData = await createRes.json();
        testUserId = createData.data.user.id;
        const tempPwd = createData.data.tempPassword;

        // Deactivate them
        await fetch(`${API_BASE}/users/${testUserId}/deactivate`, { method: 'PATCH', headers: authHeaders });

        // Try login
        const loginFailRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: createData.data.user.email, password: tempPwd })
        });
        const loginFailData = await loginFailRes.json();
        if (loginFailRes.status === 403) {
            console.log(`SUCCESS: Deactivated login blocked - ${loginFailData.message}`);
        } else {
            console.error(`FAIL: Expected 403, got ${loginFailRes.status}`);
        }

        console.log('\n--- 4. Verify Password Reset ---');
        const resetRes = await fetch(`${API_BASE}/users/${testUserId}/reset-password`, {
            method: 'POST',
            headers: authHeaders
        });
        const resetData = await resetRes.json();
        if (resetRes.ok) {
            console.log(`SUCCESS: Password reset - New temp: ${resetData.temporaryPassword}`);
        } else {
            console.error('FAIL: Password reset failed');
        }

        console.log('\n--- ALL VERIFICATIONS COMPLETE ---');
    } catch (e) {
        console.error('Verification Error:', e.message);
    }
}

verifyAll();
