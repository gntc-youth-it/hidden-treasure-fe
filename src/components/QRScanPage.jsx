import React, { useState, useEffect } from 'react';
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
  const [lastRequestTime, setLastRequestTime] = useState(0);

  // UI 헬퍼 함수
  const showToastMessage = (message, duration = 3000) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), duration);
  };

  // QR 스캔 처리 함수
  const handleQrCodeScan = async (decodedText, qrCodeInstance) => {
    try {
      const now = Date.now();
      if (now - lastRequestTime < 5000) return; // 5초 쿨다운

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

      if (!response.ok) throw new Error('API 요청 실패');

      const data = await response.json();
      showToastMessage('보물을 찾았습니다! 🎉');
      setLastRequestTime(now);

    } catch (err) {
      setLastRequestTime(Date.now());
      showToastMessage('QR 코드 처리 중 오류가 발생했습니다.');
    }
  };

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

  const handleCameraSwitch = async () => {
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
          handleQrCodeScan,
          () => {} // 스캔 중 에러는 무시
      );

      setCurrentCamera(nextCamera.id);
    } catch (err) {
      setError(`카메라 전환 실패: ${err.message}`);
    }
  };

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

          await new Promise(resolve => setTimeout(resolve, 500));

          if (mounted) {
            await qrCodeInstance.start(
                rearCamera.id,
                {
                  fps: 10,
                  qrbox: { width: 250, height: 250 }
                },
                handleQrCodeScan,
                () => {} // 스캔 중 에러는 무시
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
      setShowToast(false);
    };
  }, []);

  // UI 렌더링
  return (
      <div className="fixed inset-0" style={{ backgroundColor: '#030511' }}>
        <div className="mx-auto h-full max-w-md flex flex-col relative" style={{ maxWidth: '430px' }}>
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
                <div id="qr-reader" className="w-full h-full" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-8 border-2 border-white/30" />
                </div>
              </div>

              {showToast && (
                  <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 opacity-90">
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
            <button className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-2xl">💭</span>
            </button>
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