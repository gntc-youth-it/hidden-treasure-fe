import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [currentCamera, setCurrentCamera] = useState(null);
  const teamNumber = location.state?.teamNumber;
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const startScanner = async (cameraId) => {
    try {
      if (html5QrCode && html5QrCode.isScanning) {
        await html5QrCode.stop();
      }

      await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            try {
              await html5QrCode.stop();
              const response = await fetch('YOUR_API_ENDPOINT', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  teamNumber: teamNumber,
                  uuid: decodedText
                })
              });

              if (!response.ok) {
                throw new Error('API 요청 실패');
              }

              const data = await response.json();
              navigate('/next-page', { state: { data } });

            } catch (err) {
              setError('QR 코드 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
              startScanner(cameraId);
            }
          },
          (errorMessage) => {
            // QR 스캔 중 에러는 무시 (계속 스캔 시도)
          }
      );
      setIsScanning(true);
      setCurrentCamera(cameraId);
    } catch (err) {
      setError('카메라 시작에 실패했습니다.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const initializeScanner = async () => {
      try {
        const qrCode = new Html5Qrcode("qr-reader");
        setHtml5QrCode(qrCode);

        const devices = await Html5Qrcode.getCameras();
        setCameras(devices);

        if (devices && devices.length) {
          // 후면 카메라 찾기
          const rearCamera = devices.find(camera =>
              camera.label.toLowerCase().includes('back') ||
              camera.label.toLowerCase().includes('rear') ||
              camera.label.toLowerCase().includes('환경') ||
              camera.label.toLowerCase().includes('후면')
          );

          // 후면 카메라가 있으면 사용, 없으면 첫 번째 카메라 사용
          const preferredCamera = rearCamera || devices[0];
          await startScanner(preferredCamera.id);
        } else {
          setError('사용 가능한 카메라가 없습니다.');
        }
      } catch (err) {
        setError('카메라 초기화에 실패했습니다.');
      }
    };

    initializeScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, []);

  const handleCameraSwitch = async () => {
    if (!cameras || cameras.length < 2) return;

    const currentIndex = cameras.findIndex(camera => camera.id === currentCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    await startScanner(cameras[nextIndex].id);
  };

  return (
      <div className="fixed inset-0" style={{ backgroundColor: '#030511' }}>
        <div className="mx-auto h-full max-w-md flex flex-col relative" style={{ maxWidth: '430px' }}>
          {/* 헤더 */}
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

          {/* 메인 컨텐츠 */}
          <main className="flex-1 flex flex-col items-center justify-center px-6">
            <div className={`w-full transition-opacity duration-1000 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              {/* 타이틀 */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">QR 코드 스캔</h1>
                <p className="text-lg text-gray-400">{teamNumber}조의 QR 코드를 스캔해주세요</p>
              </div>

              {/* QR 스캐너 */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-8 bg-black">
                <div id="qr-reader" className="w-full h-full" />
                {/* 스캔 가이드라인 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-8 border-2 border-white/30" />
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                  <div className="w-full p-4 bg-red-500/20 rounded-lg mb-4">
                    <p className="text-red-500 text-center">{error}</p>
                  </div>
              )}

              <p className="text-center text-gray-400">
                {isScanning ? 'QR 코드를 카메라에 비춰주세요' : '카메라 권한을 허용해주세요'}
              </p>
            </div>
          </main>

          {/* 챗 버튼 */}
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