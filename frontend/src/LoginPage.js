import React, { useState } from 'react';

const LoginPage = ({ onLogin }) => {
    const [accessKeyId, setAccessKeyId] = useState('');
    const [secretAccessKey, setSecretAccessKey] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        // 공백을 제거한 자격 증명 생성
        const trimmedAccessKeyId = accessKeyId.trim();
        const trimmedSecretAccessKey = secretAccessKey.trim();

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accessKeyId: trimmedAccessKeyId,
                secretAccessKey: trimmedSecretAccessKey
            })
        });
        
        if (response.ok) {
            onLogin(trimmedAccessKeyId, trimmedSecretAccessKey); // 로그인 성공 시 App으로 이동
        } else {
            alert('잘못된 자격 증명입니다. 다시 시도해주세요.');
        }
    };

    return (
        <form onSubmit={handleLogin}>
            <input
                type="text"
                placeholder="Access Key ID"
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
            />
            <input
                type="password"
                placeholder="Secret Access Key"
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
            />
            <button type="submit">로그인</button>
        </form>
    );
};

export default LoginPage;
