import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"
import Introduction from "./pages/introduction/introduction";
import Create from "./pages/create/create";
import Bet from "./pages/bet/bet";
import Gamenotfound from "./pages/error/gamenotfound/gamenotfound";

const App = () => {
  useEffect(() => {
    window.scroll(0, 0);
  }, []);

  return (
    <div className="wrapper">
      <Routes>
        <Route path="/" element={<Introduction />} />
        <Route path="/create" element={<Create />} />
        <Route path="/error/404" element={<Gamenotfound />} />
        <Route path="/:linkKey" element={<Bet />} />
      </Routes>
      <ToastContainer />
    </div>
  );
};

export default App;
