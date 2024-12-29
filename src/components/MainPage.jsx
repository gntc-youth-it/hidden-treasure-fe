import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MainPage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // 파티클의 분포를 더 넓게 조정
        const newParticles = Array.from({ length: 25 }, (_, i) => {
            // 중앙을 기준으로 한 상대적인 위치 계산
            const angle = Math.random() * Math.PI * 2; // 0-360도 랜덤 각도
            const distance = 20 + Math.random() * 100; // 중심으로부터의 거리
            const left = 50 + Math.cos(angle) * distance; // 중심점(50%)에서부터의 x좌표
            const top = 50 + Math.sin(angle) * distance;  // 중심점(50%)에서부터의 y좌표

            return {
                id: i,
                left: Math.min(Math.max(left, -20), 200), // 화면 밖으로 너무 벗어나지 않도록
                top: Math.min(Math.max(top, -20), 200),
                size: Math.random() * 6 * 3,
                duration: 2 + Math.random() * 4, // 애니메이션 시간 다양화
                delay: Math.random() * 3,
                opacity: Math.random() * 0.5 + 0.3
            };
        });
        setParticles(newParticles);
    }, []);


    const handleStart = () => {
        navigate('/form');
    };

    return (
        // Full screen container
        <div className="fixed inset-0" style={{ backgroundColor: '#030511'}}>
            {/* Content wrapper with max width */}
            <div className="mx-auto h-full max-w-md flex flex-col relative" style={{ maxWidth: '430px' }}>
                {/* Header - fixed at top */}
                <header className="w-full py-6 px-6">
                    <h2 className="text-white text-xl font-bold">GNTC-YOUTH-IT</h2>
                </header>

                {/* Main content - centered */}
                <main className="flex-1 flex flex-col items-center justify-center px-6">
                    {/* Title */}
                    <div className={`text-center mb-16 transition-opacity duration-1000 ${
                        isVisible ? 'opacity-100' : 'opacity-0'
                    }`}>
                        <h1 className="text-4xl font-bold text-white mb-2">밭에 감추인 보화</h1>
                        <p className="text-lg text-gray-400">보물을 찾으러 떠나볼까요?</p>
                    </div>

                    {/* Treasure box */}
                    <div
                        className={`relative w-32 h-32 mb-20 transition-all duration-1000 ${
                            isVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ animation: 'float 3s ease-in-out infinite' }}
                    >
                        <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-lg flex items-center justify-center transform rotate-45">
                            <span className="text-5xl transform -rotate-45">💎</span>
                        </div>

                        {/* Particles */}
                        {particles.map((particle) => (
                            <div
                                key={particle.id}
                                className="absolute rounded-full bg-blue-300 opacity-30"
                                style={{
                                    left: `${particle.left}%`,
                                    top: `${particle.top}%`,
                                    width: `${particle.size}px`,
                                    height: `${particle.size}px`,
                                    animation: `float ${particle.duration}s ease-in-out infinite`,
                                    animationDelay: `${particle.delay}s`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Button - fixed width and centered */}
                    <div className="w-full max-w-xs">
                        <button
                            onClick={handleStart}
                            className={`w-full py-4 bg-white text-black rounded-full text-lg font-bold 
                hover:bg-gray-100 transition-all duration-300 transform hover:scale-105
                ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                        >
                            보물찾기 시작하기 💎
                        </button>
                    </div>
                </main>
            </div>

            <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(45deg);
          }
          50% {
            transform: translateY(-15px) rotate(45deg);
          }
        }
      `}</style>
        </div>
    );
};

export default MainPage;