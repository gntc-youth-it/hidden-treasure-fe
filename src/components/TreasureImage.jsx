// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import axios from "axios";

// eslint-disable-next-line react/prop-types
const TreasureImage = ({ treasureId }) => {
  const [treasure, setTreasure] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
      <div>
        <h1>Treasure ID: {treasure.id}</h1>
        <img src={`data:image/png;base64,${treasure.image}`} alt="Treasure QR Code" />
      </div>
  );
};

export default TreasureImage;