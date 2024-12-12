import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RankingTable = () => {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [prevRankings, setPrevRankings] = useState([]);

    useEffect(() => {
        const fetchRankings = async () => {
            try {
                const response = await fetch('https://api.bhohwa.click/rank');
                const data = await response.json();
                setPrevRankings(rankings);
                setRankings(data);
            } catch (error) {
                console.error('Failed to fetch rankings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRankings();

        // 20초마다 순위 갱신
        const interval = setInterval(fetchRankings, 10000);
        return () => clearInterval(interval);
    }, []);

    // 순위 변경 감지 및 하이라이트 효과
    useEffect(() => {
        rankings.forEach((team, index) => {
            const prevIndex = prevRankings.findIndex(t => t.teamNumber === team.teamNumber);
            if (prevIndex !== -1 && prevIndex !== index) {
                const element = document.querySelector(`[data-team="${team.teamNumber}"]`);
                if (element) {
                    element.classList.add('highlight');
                    setTimeout(() => element.classList.remove('highlight'), 1000);
                }
            }
        });
    }, [rankings, prevRankings]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#1c1f27]">
                <div className="text-xl text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen h-full bg-[#1c1f27] text-white p-8 flex flex-col">
            <style jsx global>{`
                @keyframes highlight {
                    0% { background-color: rgba(255, 255, 255, 0.1); }
                    100% { background-color: transparent; }
                }

                .highlight {
                    animation: highlight 1s ease-out;
                }
            `}</style>

            <div className="max-w-7xl mx-auto w-full flex-1">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold">밭에 감추인 보화 순위표</h1>
                    <div className="text-sm text-gray-400">자동 갱신중</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <AnimatePresence>
                        {rankings.slice(0, 3).map((team, index) => (
                            <motion.div
                                key={team.teamNumber}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className={`p-6 rounded-xl ${
                                    index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
                                        index === 1 ? 'bg-gray-400/10 border border-gray-400/20' :
                                            'bg-orange-700/10 border border-orange-700/20'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-4xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                                    <span className={`text-2xl font-bold ${
                                        index === 0 ? 'text-yellow-500' :
                                            index === 1 ? 'text-gray-400' :
                                                'text-orange-700'
                                    }`}>{team.teamNumber}조</span>
                                </div>
                                <div className="text-lg">찾은 보물: {team.treasureCount}개</div>
                                <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`rounded-full h-2 transition-all duration-500 ease-out ${
                                            index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                    'bg-orange-700'
                                        }`}
                                        style={{ width: `${Math.min((team.treasureCount / 10) * 20, 100)}%` }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className="bg-[#2b2d3a] rounded-xl shadow-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                        <tr className="bg-[#393d4c] text-gray-300">
                            <th className="px-8 py-5 text-center text-lg">순위</th>
                            <th className="px-8 py-5 text-center text-lg">팀</th>
                            <th className="px-8 py-5 text-center text-lg">보물 개수</th>
                            <th className="px-8 py-5 text-right text-lg">진행률</th>
                        </tr>
                        </thead>
                        <tbody>
                        <AnimatePresence>
                            {rankings.map((team, index) => (
                                <motion.tr
                                    key={team.teamNumber}
                                    data-team={team.teamNumber}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    layout
                                    className={`
                                            border-b border-[#393d4c] 
                                            ${index % 2 === 0 ? 'bg-[#2b2d3a]' : 'bg-[#32354a]'}
                                            hover:bg-[#393d4c] transition-colors
                                        `}
                                >
                                    <motion.td layout className="px-8 py-6">
                                        <motion.div layout className="flex items-center text-lg justify-center">
                                            {index + 1}
                                        </motion.div>
                                    </motion.td>
                                    <motion.td layout className="px-8 py-6">
                                        <motion.div layout className="flex items-center justify-center">
                                            <span className="text-lg font-medium">{team.teamNumber}조</span>
                                        </motion.div>
                                    </motion.td>
                                    <motion.td layout className="px-8 py-6 text-center text-lg">
                                        {team.treasureCount}개
                                    </motion.td>
                                    <motion.td layout className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-4">
                                            <div className="w-24 bg-gray-700 rounded-full h-2">
                                                <div
                                                    className={`rounded-full h-2 transition-all duration-500 ease-out ${
                                                        team.treasureCount >= 8 ? 'bg-green-500' :
                                                            team.treasureCount >= 5 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                    }`}
                                                    style={{ width: `${Math.min((team.treasureCount / 10) * 50, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </motion.td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RankingTable;