import { Container, Row, Col, Image } from "react-bootstrap";
import "./imagesidebar.css";

import betdice from "../../assets/friendsdice.webp";
import betcard from "../../assets/friendscard.webp";
import betchess from "../../assets/friendschess.webp";

function ImageSidebar() {

return (

        <div className="sidebar-container px-4 mx-3">
          <div className="sidebar-bg mx-auto mt-4">
            <Image src={betdice} fluid />
          </div>

          <div className="sidebar-bg mx-auto mt-4">
            <Image src={betcard} fluid />
          </div>

          <div className="sidebar-bg mx-auto mt-4">
            <Image src={betchess} fluid />
          </div>
        </div>
  );
}

export default ImageSidebar;
