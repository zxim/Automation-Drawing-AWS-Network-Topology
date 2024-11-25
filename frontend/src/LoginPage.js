import React, { useState, useEffect } from 'react';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
    const [accessKeyId, setAccessKeyId] = useState('');
    const [secretAccessKey, setSecretAccessKey] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // 이미지 경로 배열
    const images = [
        '/img/1.png',
        '/img/2.png',
        '/img/3.png',
        '/img/4.png'
    ];

    // 슬라이드 이미지 변경 로직
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000);
    
        return () => clearInterval(interval);
    }, [images.length]); // images.length를 의존성 배열에 추가
    

    // 로그인 처리
    const handleLogin = async (e) => {
        e.preventDefault();

        const trimmedAccessKeyId = accessKeyId.trim();
        const trimmedSecretAccessKey = secretAccessKey.trim();

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessKeyId: trimmedAccessKeyId,
                    secretAccessKey: trimmedSecretAccessKey,
                }),
            });

            if (response.ok) {
                onLogin(trimmedAccessKeyId, trimmedSecretAccessKey);
            } else {
                alert('잘못된 자격 증명입니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('로그인 요청 중 오류 발생:', error);
            alert('서버와의 연결에 문제가 발생했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className="login-container">
            <h1>HYUNDAI AUTOEVER</h1>
            <div className="login-box">
                <div className="image-section">
                    <img
                        src={images[currentImageIndex]}
                        alt="슬라이드 이미지"
                        className="slideshow-image"
                    />
                </div>
                <form className="login-form" onSubmit={handleLogin}>
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
            </div>
        </div>
    );
};

export default LoginPage;
