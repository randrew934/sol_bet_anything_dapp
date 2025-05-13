import { Container, Row, Col, Image } from "react-bootstrap";
import Icon from "../../assets/icon.webp";
import "./introduction.css";

function Introduction() {
  return (
    <>
      <div className="home-banner">
        <div className="banner">
          <Container fluid className="custom-container position-relative mt-3">
            <Row className="align-items-center justify-content-between pb-0">
              <div className="banner-text-link-container px-1 px-md-0 mb-3 justify-content-center align-items-center text-end">
                <a
                  href="https://github.com/randrew934/sol_bet_anything_dapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="banner-text-link mx-auto m-0 p-0 text-center text-decoration-none"
                >
                  <button className="banner-text-link-button m-2" id="check-docs-button">
                    Docs
                  </button>
                </a>
              </div>
              <Col lg={5} className="mt-1 mt-md-2 mb-3">
                <div className="sba-logo">
                  <Image src={Icon} fluid />
                </div>
              </Col>
              <Col lg={7} className="p-0 p-lg-5 mt-sm-2 mt-0">
                <div className="mt-0 pb-0 m-0">
                  <h1 className="welcome-heading text-uppercase text-center text-lg-start mb-2">
                  SOL BET ANYTHING
                  </h1>

                  <div className="banner-text-container px-1 px-md-0 text-center text-lg-start">
                    <h6 className="banner-text mt-3 mt-sm-1 mx-auto mx-lg-0 px-3 px-md-0">
                    It’s your game. It’s your rules. Bet anything from Sports 
                    games to Event forecasts to X(Twitter) Banters. All you need is Solana.
                    </h6>
                  </div>
                  <div className="mt-3 mt-md-4 mb-2 pb-0">
                    <button
                      className="launch-btn mb-0 mx-sm-auto mx-md-auto mx-lg-0"
                      id="launch-app-button"
                      onClick={() => (window.location.href = "/create")}
                    >
                      Create Game
                    </button>
                  </div>
                
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    </>
  );
}

export default Introduction;
