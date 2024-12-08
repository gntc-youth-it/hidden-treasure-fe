import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
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
      setDebugInfo(prev => prev + `\n카메라 시작 시도: ${cameraId}`);

      if (html5QrCode?.isScanning) {
        setDebugInfo(prev => prev + '\n이전 스캔 중지');
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
          () => {} // 스캔 중 에러는 무시
      );
      setIsScanning(true);
      setCurrentCamera(cameraId);
      setDebugInfo(prev => prev + '\n카메라 시작 성공');
    } catch (err) {
      setDebugInfo(prev => prev + `\n카메라 시작 실패: ${err.message}`);
      setError(`카메라 시작에 실패했습니다: ${err.message}`);
      setIsScanning(false);
    }
  };

  const findRearCamera = (devices) => {
    setDebugInfo(prev => prev + '\n사용 가능한 카메라:');
    devices.forEach(device => {
      setDebugInfo(prev => prev + `\n - ${device.label} (${device.id})`);
    });

    // 후면 카메라 찾기 시도
    const rearCamera = devices.find(camera => {
      const label = (camera.label || '').toLowerCase();
      return label.includes('back') ||
          label.includes('rear') ||
          label.includes('환경') ||
          label.includes('후면');
    });

    if (rearCamera) {
      setDebugInfo(prev => prev + `\n후면 카메라 발견: ${rearCamera.label}`);
      return rearCamera;
    }

    // 레이블에서 찾지 못한 경우, 마지막 카메라를 후면 카메라로 가정
    setDebugInfo(prev => prev + '\n후면 카메라를 찾지 못해 마지막 카메라 선택');
    return devices[devices.length - 1];
  };

  useEffect(() => {
    let mounted = true;
    let qrCodeInstance = null;

    const initializeScanner = async () => {
      try {
        setDebugInfo('스캐너 초기화 시작');

        if (!document.getElementById("qr-reader")) {
          throw new Error('QR 스캐너 요소를 찾을 수 없습니다.');
        }

        // QR 스캐너 인스턴스 생성
        qrCodeInstance = new Html5Qrcode("qr-reader");
        setDebugInfo(prev => prev + '\nQR 스캐너 인스턴스 생성 성공');

        if (mounted) {
          setHtml5QrCode(qrCodeInstance);
        }

        // 카메라 목록 가져오기
        const devices = await Html5Qrcode.getCameras();
        setDebugInfo(prev => prev + `\n감지된 카메라 수: ${devices.length}`);

        if (mounted && devices && devices.length > 0) {
          setCameras(devices);
          const rearCamera = findRearCamera(devices);

          // html5QrCode 상태가 업데이트될 때까지 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500));

          if (mounted) {
            await qrCodeInstance.start(
                rearCamera.id,
                {
                  fps: 10,
                  qrbox: { width: 250, height: 250 }
                },
                async (decodedText) => {
                  try {
                    await qrCodeInstance.stop();
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
                    if(qrCodeInstance) qrCodeInstance.start(rearCamera.id);
                  }
                },
                () => {}
            );
            setIsScanning(true);
            setCurrentCamera(rearCamera.id);
            setError(''); // 성공 시 에러 메시지 초기화
            setDebugInfo(prev => prev + '\n카메라 시작 성공');
          }
        } else {
          throw new Error('사용 가능한 카메라가 없습니다.');
        }
      } catch (err) {
        console.error('Camera initialization error:', err);
        if (mounted) {
          setError(err.message);
          setDebugInfo(prev => prev + `\n초기화 실패: ${err.message}`);
        }
      }
    };

    // 약간의 지연 후 초기화 시작
    setTimeout(initializeScanner, 1000);

    return () => {
      mounted = false;
      if (qrCodeInstance && qrCodeInstance.isScanning) {
        qrCodeInstance.stop().catch(console.error);
      }
    };
  }, []);

  const handleCameraSwitch = async () => {
    if (!cameras || cameras.length < 2) return;

    const currentIndex = cameras.findIndex(camera => camera.id === currentCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setDebugInfo(prev => prev + `\n카메라 전환: ${currentIndex} -> ${nextIndex}`);
    await startScanner(cameras[nextIndex].id);
  };

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
                <h1 className="text-3xl font-bold text-white mb-2">QR 코드 스캔</h1>
                <p className="text-lg text-gray-400">{teamNumber}조의 QR 코드를 스캔해주세요</p>
              </div>

              <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-8 bg-black">
                <div id="qr-reader" className="w-full h-full" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-8 border-2 border-white/30" />
                </div>
              </div>

              {error && (
                  <div className="w-full p-4 bg-red-500/20 rounded-lg mb-4">
                    <p className="text-red-500 text-center">{error}</p>
                  </div>
              )}

              {/* 디버그 정보 제거 */}
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