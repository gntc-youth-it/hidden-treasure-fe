// eslint-disable-next-line no-unused-vars
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useParams
} from "react-router-dom";
import TreasureImage from "./components/TreasureImage";

function App() {
  return (
      <Router>
        <Routes>
          {/* 기본 페이지 */}
          <Route path="/" element={<h1>Welcome to the Treasure Viewer!</h1>} />

          {/* /:treasureId 경로에서 TreasureImage 컴포넌트를 렌더링 */}
          <Route path="/:treasureId" element={<TreasureRoute />} />
        </Routes>
      </Router>
  );
}

// URL에서 treasureId를 받아 TreasureImage에 전달
const TreasureRoute = () => {
  const { treasureId } = useParams(); // react-router-dom에서 제공
  return <TreasureImage treasureId={parseInt(treasureId, 10)} />;
};

export default App;