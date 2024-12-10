import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanPage = () => {
  const location = useLocation();
  const teamNumber = location.state?.teamNumber;

  // UI 상태
  const [isVisible, setIsVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  // 카메라 상태
  const [cameras, setCameras] = useState([]);
  const [currentCamera, setCurrentCamera] = useState(null);
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const lastRequestTimeRef = useRef(0);
  const toastTimerRef = useRef(null);

  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const statsTimerRef = useRef(null);
  const [noTreasure, setNoTreasure] = useState(false);

  // UI 헬퍼 함수
  const showToastMessage = useCallback((message, duration = 3000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToastMessage(message);
    setShowToast(true);

    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
      toastTimerRef.current = null;
    }, duration);
  }, []);

  // QR 스캔 처리 함수
  const handleQrCodeScanRef = useRef(async (decodedText) => {
    try {
      const now = Date.now();
      if (now - lastRequestTimeRef.current < 5000) {
        console.log('Throttled: Too soon after last request');
        return;
      }

      lastRequestTimeRef.current = now;

      const response = await fetch('https://api.bhohwa.click/treasure/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamNumber,
          treasureCode: decodedText
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showToastMessage(data.message);
        return;
      }
      showToastMessage('보물을 찾았습니다! 🎉');
    } catch (err) {
      showToastMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }).current;

  // 카메라 관련 함수
  const findRearCamera = (devices) => {
    const rearCamera = devices.find(camera => {
      const label = (camera.label || '').toLowerCase();
      return label.includes('back') ||
          label.includes('rear') ||
          label.includes('환경') ||
          label.includes('후면');
    });
    return rearCamera || devices[devices.length - 1];
  };

  const handleCameraSwitch = useCallback(async () => {
    if (!cameras?.length || cameras.length < 2) return;

    const currentIndex = cameras.findIndex(camera => camera.id === currentCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    try {
      if (html5QrCode?.isScanning) {
        await html5QrCode.stop();
      }

      await html5QrCode.start(
          nextCamera.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          handleQrCodeScanRef,  // useRef로 변경된 함수 사용
          () => {}
      );

      setCurrentCamera(nextCamera.id);
    } catch (err) {
      setError(`카메라 전환 실패: ${err.message}`);
    }
  }, [cameras, currentCamera, html5QrCode]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`https://api.bhohwa.click/rank/${teamNumber}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.code === 8001) {
          setNoTreasure(true);
          setStats(null);
        }
        return;
      }
      setNoTreasure(false);
      setStats(data);
    } catch (err) {
      showToastMessage('순위 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleStatsClick = () => {
    if (!isStatsOpen) {
      fetchStats();
    }
    setIsStatsOpen(!isStatsOpen);
  };


  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // 초기화 효과
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // 카메라 초기화 효과
  useEffect(() => {
    let mounted = true;
    let qrCodeInstance = null;

    const initializeScanner = async () => {
      try {
        if (!document.getElementById("qr-reader")) {
          throw new Error('QR 스캐너 요소를 찾을 수 없습니다.');
        }

        qrCodeInstance = new Html5Qrcode("qr-reader");
        if (mounted) setHtml5QrCode(qrCodeInstance);

        const devices = await Html5Qrcode.getCameras();
        if (!devices?.length) throw new Error('사용 가능한 카메라가 없습니다.');

        if (mounted) {
          setCameras(devices);
          const rearCamera = findRearCamera(devices);

          if (mounted) {
            await qrCodeInstance.start(
                rearCamera.id,
                {
                  fps: 10,
                  qrbox: { width: 250, height: 250 }
                },
                handleQrCodeScanRef,  // useRef로 변경된 함수 사용
                () => {}
            );
            setCurrentCamera(rearCamera.id);
            setError('');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      }
    };

    setTimeout(initializeScanner, 1000);

    return () => {
      mounted = false;
      if (qrCodeInstance?.isScanning) {
        qrCodeInstance.stop().catch(console.error);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setShowToast(false);
    };
  }, []); // 빈 의존성 배열

  useEffect(() => {
    if (isStatsOpen) {
      // 이전 타이머가 있다면 제거
      if (statsTimerRef.current) {
        clearTimeout(statsTimerRef.current);
      }

      // 5초 후 자동 닫힘
      statsTimerRef.current = setTimeout(() => {
        setIsStatsOpen(false);
        statsTimerRef.current = null;
      }, 5000);
    }

    // 컴포넌트 언마운트 또는 상태 변경 시 타이머 정리
    return () => {
      if (statsTimerRef.current) {
        clearTimeout(statsTimerRef.current);
      }
    };
  }, [isStatsOpen]);

  // UI 렌더링
  return (
      <div className="fixed inset-0" style={{ backgroundColor: '#030511' }}>
        <div className="mx-auto h-full max-w-md flex flex-col relative" style={{maxWidth: '430px'}}>
          <header className="w-full py-6 px-6 flex justify-between items-center">
            <h2 className="text-white text-xl font-bold">GNTC-YOUTH-IT</h2>
            {cameras.length > 1 && (
                <button
                    onClick={handleCameraSwitch}
                    className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm flex items-center"
                >
                  📷 카메라 전환
                </button>
            )}
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6">
            <div className={`w-full transition-opacity duration-1000 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">보물 QR 코드 스캔</h1>
                <p className="text-lg text-gray-400">{teamNumber}조 보물의 QR 코드를 스캔해주세요</p>
              </div>

              <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-8 bg-black">
                <div id="qr-reader" className="w-full h-full"/>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-8 border-2 border-white/30"/>
                </div>
              </div>

              {showToast && (
                  <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
                    <div
                        className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 opacity-90">
                      {toastMessage}
                    </div>
                  </div>
              )}

              {error && (
                  <div className="w-full p-4 bg-red-500/20 rounded-lg mb-4">
                    <p className="text-red-500 text-center">{error}</p>
                  </div>
              )}
            </div>
          </main>

          <div className="absolute bottom-6 right-6">
            <div className={`flex items-center bg-gray-800 rounded-full transition-all duration-300 ${
                isStatsOpen ? 'px-6' : 'px-3'
            }`}>
              {isStatsOpen && (
                  <>
                    {noTreasure ? (
                        <div className="flex items-center mr-4">
                          <span className="text-gray-400">아직까지 찾은 보물이 없습니다.</span>
                        </div>
                    ) : stats && (
                        <div className="flex items-center mr-4 text-white">
                          <div className="text-center mr-6">
                            <div className="text-sm text-gray-400">찾은 보물</div>
                            <div className="text-xl font-bold">{stats.treasureCount}개</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-400">현재 순위</div>
                            <div className="text-xl font-bold">{stats.rank}위</div>
                          </div>
                        </div>
                    )}
                  </>
              )}
              <button
                  onClick={handleStatsClick}
                  className="w-12 h-12 flex items-center justify-center"
              >
                <span className="text-2xl">{isStatsOpen ? '📊' : '💭'}</span>
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          #qr-reader {
            border: none !important;
            width: 100% !important;
            height: 100% !important;
          }

          #qr-reader video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }

          #qr-reader__dashboard {
            display: none !important;
          }
        `}</style>
      </div>
  );
};

export default QRScanPage;