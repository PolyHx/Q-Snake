import React from 'react';
import Board from './Board.js';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Container, Row, Col } from 'react-bootstrap';
import Logo from './img/cyborg-25.png';
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();
  return (
    <Container fluid className="wrapper">
      <Row className="justify-content-center align-items-center">
        <Col md="auto" lg="auto" sm="auto" xs="auto">
          <img src={Logo} width="300" alt="Q-Snake Logo"></img>
        </Col>
        <Col md="auto" lg="auto" sm="auto" xs="auto">
          <h1
            style={{
              'font-family': 'FacileSans',
              'font-size': 60,
              color: 'white',
            }}
          >
            Q-Snake
          </h1>
        </Col>
      </Row>

      <Row className="justify-content-center align-content-center">
        <Col md="auto" lg="auto" sm="auto" xs="auto">
          <Card
            className="bg-light"
            style={{
              'max-width': '18em',
              'min-width': '200px',
              'background-color': '#fafafa',
            }}
          >
            <Card.Body>
              <Card.Title>
                <b>{t('what.title')}</b>
              </Card.Title>
              <Card.Text>
                <p>• {t('what.p1')}</p>
                <p>• {t('what.p2')}</p>
                <p>
                  • {t('what.p3')}{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://en.wikipedia.org/wiki/Q-learning"
                  >
                    tabular Q-learning
                  </a>
                  .
                </p>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md="auto" lg="auto" sm="auto" xs="auto">
          <Card
            className="bg-light"
            style={{
              'max-width': '18em',
              'min-width': '200px',
              'background-color': '#fafafa',
            }}
          >
            <Card.Body>
              <Card.Title>
                <b>{t('how.title')}</b>
              </Card.Title>
              <Card.Text>
                <p>• {t('how.p1')}</p>
                <p>• {t('how.p2')}</p>
                <p>
                  • {t('how.p3')}{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://www.github.com/PolyHx/q-snake"
                  >
                    GitHub
                  </a>
                  .
                </p>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Board />
    </Container>
  );
}

export default App;
