import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TeamForm = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [teamNumber, setTeamNumber] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!teamNumber) {
            setError('조 번호를 입력해주세요');
            return;
        }
        // QR 스캔 페이지로 이동하면서 조 번호 전달
        navigate('/qr-scan', { state: { teamNumber } });
    };

    const handleTeamNumberChange = (e) => {
        const value = e.target.value;
        // 숫자만 입력 가능하도록
        if (value === '' || /^[0-9\b]+$/.test(value)) {
            setTeamNumber(value);
            setError('');
        }
    };

    return (
        <div className="fixed inset-0" style={{ backgroundColor: '#030511'}}>
            <div className="mx-auto h-full max-w-md flex flex-col relative" style={{ maxWidth: '430px' }}>
                {/* 헤더 */}
                <header className="w-full py-6 px-6">
                    <h2 className="text-white text-xl font-bold">GNTC-YOUTH-IT</h2>
                </header>

                {/* 메인 컨텐츠 */}
                <main className="flex-1 flex flex-col items-center justify-center px-6">
                    <div className={`w-full max-w-sm transition-opacity duration-1000 ${
                        isVisible ? 'opacity-100' : 'opacity-0'
                    }`}>
                        {/* 타이틀 */}
                        <div className="text-center mb-12">
                            <h1 className="text-3xl font-bold text-white mb-2">조 번호 입력</h1>
                            <p className="text-lg text-gray-400">몇 조인지 입력해주세요</p>
                        </div>

                        {/* 입력 폼 */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="teamNumber" className="block text-sm font-medium text-gray-400">
                                    조 번호
                                </label>
                                <input
                                    type="text"
                                    id="teamNumber"
                                    value={teamNumber}
                                    onChange={handleTeamNumberChange}
                                    placeholder="숫자만 입력해주세요"
                                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    maxLength={2}
                                />
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                            </div>

                            {/* 제출 버튼 */}
                            <button
                                type="submit"
                                className="w-full py-4 bg-white text-black rounded-full text-lg font-bold
                                    hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                            >
                                다음 단계로
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TeamForm;