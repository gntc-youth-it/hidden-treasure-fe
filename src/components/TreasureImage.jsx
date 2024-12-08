// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const TreasureImage = ({ treasureId }) => {
  const [treasure, setTreasure] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // 페이지 이동을 위한 hook

  // QR 데이터를 가져오는 함수
  useEffect(() => {
    const fetchTreasure = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8080/treasure/${treasureId}`);
        setTreasure(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTreasure();
  }, [treasureId]);

  // 새로운 Treasure 생성 요청 함수
  const createTreasure = async () => {
    try {
      const response = await axios.post("http://localhost:8080/treasure");
      const newTreasureId = response.data.id;
      navigate(`/${newTreasureId}`); // 생성된 QR로 이동
    } catch (err) {
      alert("Failed to create treasure: " + err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
      <div>
        {/* QR 생성 버튼 */}
        <button onClick={createTreasure}>Create New Treasure</button>

        {/* QR 코드 정보 표시 */}
        <h1>Treasure ID: {treasure.id}</h1>
        <img src={`data:image/png;base64,${treasure.image}`} alt="Treasure QR Code" />
      </div>
  );
};

export default TreasureImage;