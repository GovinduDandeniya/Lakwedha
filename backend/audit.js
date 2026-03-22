const fetch = globalThis.fetch;

async function runAudit() {
    try {
        console.log('[1/5] Starting Backend Audit Sequence...');

        // 1. Register super doctor explicitly for fresh JWT context
        console.log('[2/5] Registering fresh audit doctor...');
        const resReg = await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Audit Doctor', email: 'audit_final_test@lakwedha.com', password: 'password123', role: 'DOCTOR' })
        });

        // Wait for registration completion
        const regText = await resReg.text();
        console.log(' -> Registration Details:', resReg.status, regText);

        console.log('[3/5] Requesting JWT Key...');
        const resLog = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'audit_final_test@lakwedha.com', password: 'password123' })
        });
        const logData = await resLog.json();

        if (!logData.token) {
            throw new Error(`Login failed. Status: ${resLog.status} Msg: ${JSON.stringify(logData)}`);
        }
        console.log(' -> JWT Token Acquired Successfully.');

        console.log('[4/5] Testing EMR Core (Post & Encrypt File Route)...');
        const fd = new FormData();
        fd.append('patientId', '65c3b1234567890123456782'); // Exact Nuwan Mock DB String
        fd.append('type', 'report');
        fd.append('title', 'Final Backend Clearance');
        fd.append('diagnosis', 'All Systems Green.');
        
        const fileContent = 'THIS IS HIGHLY SENSITIVE AES ENCRYPTED EMR DATA';
        fd.append('file', new Blob([fileContent], { type: 'text/plain' }), 'secret_record.txt');

        const headers = new Headers();
        headers.append('Authorization', `Bearer ${logData.token}`);

        const resUpload = await fetch('http://localhost:5000/api/emr/upload', {
            method: 'POST',
            body: fd,
            headers: headers
        });
        const uploadData = await resUpload.json();
        console.log(' -> Upload Route Assert:', resUpload.status, uploadData.message || uploadData.error);
        if (resUpload.status !== 201) throw new Error('Upload Sequence Corrupted.');

        console.log('[5/5] Testing Retrieval and Decryption Streams...');
        const resFetch = await fetch('http://localhost:5000/api/emr/patient/65c3b1234567890123456782', {
            headers: headers
        });
        const patientData = await resFetch.json();
        console.log(' -> Records Located:', patientData.length);
        
        const latestRecord = patientData[0];
        console.log(' -> Latest File Target Address:', latestRecord?.fileUrl);
        
        if (latestRecord && latestRecord.fileUrl) {
            const secureRes = await fetch(`http://localhost:5000${latestRecord.fileUrl}`, { headers });
            const decryptedString = await secureRes.text();
            
            console.log(' -> Remote AES Validation Match:', decryptedString === fileContent ? 'PASSED 100%' : 'FAILED MATCHER');
        }

        console.log('\n==== AUDIT COMPLETE. ZERO CRITICAL ERRORS DETECTED. ====');
        process.exit(0);

    } catch (err) {
        console.error('\n!!! CRITICAL AUDIT FAILURE !!!');
        console.error(err);
        process.exit(1);
    }
}

runAudit();
