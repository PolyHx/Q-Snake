import React, { Component } from 'react';
import SnakeDot from './SnakeDot.js';
import Food from './Food.js';
import State from './State.js';
import QTable from './QTable.js';
import { Form, Row, Col, Button, Card } from 'react-bootstrap';
import { withTranslation } from 'react-i18next';

const genCoords = () => {
  return [
    Math.floor(Math.random() * 20) * 5,
    Math.floor(Math.random() * 20) * 5,
  ];
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const manhattanDist = (p1, p2) => {
  return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]);
};

const createQTable = () => {
  var arr = [];
  for (var i = 0; i < 8; i++) {
    var oth = [];
    for (var j = 0; j < 16; j++) {
      oth.push([0, 0, 0, 0]);
    }
    arr.push(oth);
  }
  return arr;
};

const createVisited = () => {
  var arr = [];
  for (var i = 0; i < 8; i++) {
    var oth = [];
    for (var j = 0; j < 16; j++) {
      oth.push(false);
    }
    arr.push(oth);
  }
  return arr;
};

var Q_table = createQTable();
var visited = createVisited();

const dirs = [
  [-5, 0],
  [0, -5],
  [5, 0],
  [0, 5],
];

const startState = {
  // Environment params:
  dots: [genCoords()],
  food: genCoords(),
  direction: 2,
  speed: 100,
  score: 0,
  justAte: false,
  max_score: 0,

  // Q learning hyperparams:
  ep: 0,
  start_epsilon: 0.9,
  end_epsilon: 0,
  epsilon: 0.9,
  episodes: 100,
  discount_factor: 1.0,
  agent_state: 2, // 0 train, 1 test, 2 idle
};

const checkBounds = (head) => {
  return head[0] < 0 || head[0] > 95 || head[1] < 0 || head[1] > 95;
};

class Board extends Component {
  state = startState;

  componentDidMount() {
    //this.qlearning();
    //setInterval(this.moveSnake, this.state.speed);
    //document.onkeydown = this.onKeyDown;
  }

  setDir(val) {
    if (
      this.state.dots.length === 2 &&
      Math.abs(this.state.direction - (val - 37)) === 2
    ) {
      this.setState({ direction: val - 37 });
      return true;
    } else if (val >= 37 && val <= 40) {
      this.setState({ direction: val - 37 });
      return false;
    }
  }

  onKeyDown = (e) => {
    e = e || window.event();
    // length 2 opposite direction exception
    if (this.setDir(parseInt(e.keyCode))) {
      this.gameOver();
    }
  };

  moveSnake = () => {
    var state = this.state;
    var newx = state.dots[state.dots.length - 1][0];
    var newy = state.dots[state.dots.length - 1][1];
    var foodFound = false;
    var valid = true;

    newx += dirs[state.direction][0];
    newy += dirs[state.direction][1];

    if (newx === state.food[0] && newy === state.food[1]) {
      while (true) {
        valid = true;
        state.food = genCoords();
        // eslint-disable-next-line no-loop-func
        state.dots.forEach((dot, i) => {
          if (dot[0] === state.food[0] && dot[1] === state.food[1]) {
            valid = false;
          }
        });
        if (valid) break;
      }
      state.score++;
      //if(state.speed > 20) state.speed -= 10;
      foodFound = true;
    }
    state.justAte = foodFound;
    state.dots.push([newx, newy]);
    if (this.checkBorders() || this.checkCollapsed()) {
      this.gameOver();
      return true;
    } else {
      if (!foodFound) state.dots.shift();
      this.setState(state);
      return false;
    }
  };

  checkBorders = () => {
    var head = this.state.dots[this.state.dots.length - 1];
    if (checkBounds(head)) {
      return true;
    }
    return false;
  };

  checkCollapsed = () => {
    var lost = false;
    var head = this.state.dots[this.state.dots.length - 1];
    this.state.dots.forEach((dot, i) => {
      if (
        i !== 0 &&
        i !== this.state.dots.length - 1 &&
        head[0] === dot[0] &&
        head[1] === dot[1]
      ) {
        lost = true;
      }
    });
    return lost;
  };

  gameOver = () => {
    this.setState({
      ...this.state,
      dots: [genCoords()],
      food: genCoords(),
      direction: 2,
      score: 0,
      justAte: false,
    });
  };

  action = (eps, dir, v1) => {
    if (Math.random() < eps) {
      return Math.floor(Math.random() * 4);
    } else {
      var mx = -100000,
        ind = 0;
      for (var i = 0; i < 4; i++) {
        if (Q_table[dir][v1][i] > mx) {
          mx = Q_table[dir][v1][i];
          ind = i;
        }
      }
      return parseInt(ind);
    }
  };

  qlearning = async () => {
    Q_table = createQTable();
    visited = createVisited();
    var mx,
      mxs = 0,
      done,
      reward;
    var next_surr, next_dir, next_v1;
    var surr, dir, v1, dist, action, steps;
    var cur_epsilon = this.state.start_epsilon;
    var dec =
      (this.state.start_epsilon - this.state.end_epsilon) / this.state.episodes;

    for (var ep = 0; ep < this.state.episodes; ep++) {
      done = false;
      [surr, dir] = this.getState();
      v1 = surr[0] + 2 * surr[1] + 4 * surr[2] + 8 * surr[3];
      steps = 0;

      while (!done) {
        dist = manhattanDist(
          this.state.food,
          this.state.dots[this.state.dots.length - 1],
        );

        // step
        action = this.action(cur_epsilon, dir, v1);
        visited[dir][v1] = true;

        // moving and checking the length 2 edge case:
        if (this.setDir(action + 37)) done = true;
        else await delay(this.state.speed);

        done = done || steps >= 500 || this.moveSnake();
        if (!done) {
          [next_surr, next_dir] = this.getState();
          next_v1 =
            next_surr[0] +
            2 * next_surr[1] +
            4 * next_surr[2] +
            8 * next_surr[3];
        }

        // reward
        if (done) reward = -100;
        else if (this.state.justAte) reward = 30;
        else if (
          manhattanDist(
            this.state.food,
            this.state.dots[this.state.dots.length - 1],
          ) < dist
        )
          reward = 1;
        else reward = -5;

        if (!done) {
          mx = -100000;
          for (var i = 0; i < 4; i++) {
            if (Q_table[next_dir][next_v1][i] >= mx) {
              mx = Q_table[next_dir][next_v1][i];
            }
          }
        } else mx = 0;

        Q_table[dir][v1][action] +=
          0.01 *
          (reward + this.state.discount_factor * mx - Q_table[dir][v1][action]);

        v1 = next_v1;
        dir = next_dir;
        if (this.state.justAte) steps++;
        else steps = 0;

        if (this.state.agent_state !== 0) break;
        if (this.state.score > mxs) mxs = this.state.score;
      }
      this.gameOver();
      if (cur_epsilon - dec >= this.state.end_epsilon) cur_epsilon -= dec;
      else cur_epsilon = this.state.end_epsilon;

      //cur_epsilon *= 0.994;

      this.setState({
        ...this.state,
        max_score: mxs,
        ep: ep + 1,
        epsilon: cur_epsilon,
      });
      if (this.state.agent_state !== 0) break;
    }
    console.log(Q_table);
  };

  /*
        State definition:
            surr = 4 cells around the head  LURD
            dir = relative pos of the apple (8 possible vals 0 - 7)
    */
  getState = () => {
    var surr = [0, 0, 0, 0];
    var dir = 0;
    var head = this.state.dots[this.state.dots.length - 1];
    var relx = head[0] - this.state.food[0];
    var rely = head[1] - this.state.food[1];

    if (relx < 0 && rely < 0) dir = 6;
    else if (relx === 0 && rely < 0) dir = 5;
    else if (relx > 0 && rely < 0) dir = 4;
    else if (relx > 0 && rely === 0) dir = 3;
    else if (relx > 0 && rely > 0) dir = 2;
    else if (relx === 0 && rely > 0) dir = 1;
    else if (relx < 0 && rely > 0) dir = 0;
    else if (relx < 0 && rely === 0) dir = 7;

    for (var index = 0; index < 4; index++) {
      if (checkBounds([head[0] + dirs[index][0], head[1] + dirs[index][1]])) {
        surr[index] = 1;
      } else {
        // eslint-disable-next-line no-loop-func
        this.state.dots.forEach((dot, i) => {
          if (i <= this.state.dots.length - 2) {
            if (
              dot[0] === head[0] + dirs[index][0] &&
              dot[1] === head[1] + dirs[index][1]
            )
              surr[index] = 1;
          }
        });
      }
    }

    return [surr, dir];
  };

  changeSpeed = (event) => {
    this.setState({ ...this.state, speed: parseInt(event.target.value) });
    event.preventDefault();
  };

  handleSubmit = (event) => {
    this.setState(
      {
        ...this.state,
        start_epsilon: parseFloat(event.target[0].value),
        discount_factor: parseFloat(event.target[1].value),
        end_epsilon: parseFloat(event.target[2].value),
        epsilon: parseFloat(event.target[0].value),
        agent_state: 0,
        episodes: parseInt(event.target[3].value),
      },
      () => {
        console.log(this.state);
        this.qlearning();
      },
    );
    event.preventDefault();
  };

  testAgent = async () => {
    var done,
      mxs = 0;
    var next_surr, next_dir, next_v1;
    let surr, dir, v1, action, steps;
    while (this.state.agent_state === 1) {
      done = false;
      [surr, dir] = this.getState();
      v1 = surr[0] + 2 * surr[1] + 4 * surr[2] + 8 * surr[3];
      steps = 0;

      while (!done) {
        // step
        action = this.action(0, dir, v1);

        // moving and checking the length 2 edge case:
        if (this.setDir(action + 37)) done = true;
        else await delay(this.state.speed);

        done = done || steps >= 500 || this.moveSnake();
        if (!done) {
          [next_surr, next_dir] = this.getState();
          next_v1 =
            next_surr[0] +
            2 * next_surr[1] +
            4 * next_surr[2] +
            8 * next_surr[3];
        }

        v1 = next_v1;
        dir = next_dir;
        if (this.state.justAte) steps++;
        else steps = 0;

        if (this.state.score > mxs) mxs = this.state.score;

        if (this.state.agent_state !== 1 || steps > 500) break;
      }
      this.gameOver();
      this.setState({ ...this.state, max_score: mxs });
    }
  };

  setTestAgentState = () => {
    if (this.state.agent_state !== 1) {
      this.setState({ ...this.state, agent_state: 1 }, () => {
        console.log('State updated to test.');
        this.testAgent();
      });
    }
  };

  render() {
    const { t } = this.props;
    return (
      <>
        <Row
          className="justify-content-center align-content-center"
          style={{ 'margin-top': '30px' }}
        >
          <Col md="auto" lg="auto" sm="auto" xs="auto">
            <Card style={{ 'min-width': '200px' }}>
              <Card.Body>
                <Card.Title>
                  <b>{t('parameters.title')}</b>
                </Card.Title>
                <Card.Text>
                  <Form onSubmit={this.handleSubmit}>
                    <Form.Row>
                      <Form.Group style={{ 'min-width': '255px' }}>
                        <Form.Label>{t('parameters.start')}:</Form.Label>
                        <Form.Control
                          name="start_epsilon"
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          required
                        />
                      </Form.Group>
                    </Form.Row>
                    <Form.Row>
                      <Form.Group style={{ 'min-width': '255px' }}>
                        <Form.Label>{t('parameters.discount')}:</Form.Label>
                        <Form.Control
                          name="discount_factor"
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          required
                        />
                      </Form.Group>
                    </Form.Row>

                    <Form.Row>
                      <Form.Group style={{ 'min-width': '255px' }}>
                        <Form.Label>{t('parameters.end')}:</Form.Label>
                        <Form.Control
                          name="end_epsilon"
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          required
                        />
                      </Form.Group>
                    </Form.Row>
                    <Form.Row>
                      <Form.Group style={{ 'min-width': '255px' }}>
                        <Form.Label>{t('parameters.episodes')}:</Form.Label>
                        <Form.Control
                          name="episodes"
                          type="number"
                          min="10"
                          max="5000"
                          required
                        />
                      </Form.Group>
                    </Form.Row>
                    <Form.Row>
                      <Form.Group as={Col}>
                        <div
                          style={{ display: 'flex', justifyContent: 'center' }}
                        >
                          <Button type="submit" variant="primary">
                            {t('parameters.train')}
                          </Button>
                        </div>
                      </Form.Group>
                      <Form.Group as={Col}>
                        <div
                          style={{ display: 'flex', justifyContent: 'center' }}
                        >
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => {
                              this.setState({ ...this.state, agent_state: 2 });
                            }}
                          >
                            {t('parameters.stop')}
                          </Button>
                        </div>
                      </Form.Group>
                      <Form.Group as={Col}>
                        <div
                          style={{ display: 'flex', justifyContent: 'center' }}
                        >
                          <Button
                            variant="primary"
                            onClick={this.setTestAgentState}
                          >
                            {t('parameters.test')}
                          </Button>
                        </div>
                      </Form.Group>
                    </Form.Row>
                  </Form>
                  <Row className="justify-content-center">
                    <small>{t('parameters.note')}</small>
                  </Row>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md="auto" lg="auto" sm="auto" xs="auto">
            <Card className="bg-light" style={{ 'min-width': '288px' }}>
              <Card.Body>
                <Card.Title>
                  <b>{t('speed.title')}:</b>
                </Card.Title>
                <Card.Text>
                  <Form>
                    <Form.Group style={{ 'text-align': 'center' }}>
                      <Form.Label>{t('speed.delay')}: </Form.Label>
                      <Form.Control
                        type="range"
                        min="10"
                        max="200"
                        step="5"
                        onChange={(e) => this.changeSpeed(e)}
                      />
                    </Form.Group>
                  </Form>
                </Card.Text>
                <Card.Title>
                  <b>{t('currentRun.title')}:</b>
                </Card.Title>
                <Card.Text>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginLeft: '10px',
                      marginRight: '10px',
                    }}
                  >
                    <p>{t('parameters.episodes')}: </p>
                    <p>
                      {this.state.ep} / {this.state.episodes}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginLeft: '10px',
                      marginRight: '10px',
                    }}
                  >
                    <p>{t('parameters.start')}: </p>
                    <p>{this.state.start_epsilon}</p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginLeft: '10px',
                      marginRight: '10px',
                    }}
                  >
                    <p>{t('parameters.end')}: </p>
                    <p>{this.state.end_epsilon}</p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginLeft: '10px',
                      marginRight: '10px',
                    }}
                  >
                    <p>{t('currentRun.currentEpsilon')}: </p>
                    <p>{parseFloat(this.state.epsilon).toFixed(3)}</p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginLeft: '10px',
                      marginRight: '10px',
                    }}
                  >
                    <p>{t('parameters.discount')}: </p>
                    <p>{this.state.discount_factor}</p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginLeft: '10px',
                      marginRight: '10px',
                    }}
                  >
                    <p>{t('currentRun.currentScore')}: </p>
                    <p>{this.state.score}</p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginLeft: '10px',
                      marginRight: '10px',
                    }}
                  >
                    <p>{t('currentRun.maxScore')}: </p>
                    <p>{this.state.max_score}</p>
                  </div>
                </Card.Text>
                <Card.Title>
                  <b>{t('agentSee.title')}</b>
                </Card.Title>
                <Card.Text>
                  <Row>
                    <Col style={{ width: '40px', 'margin-left': '20px' }}>
                      {t('agentSee.p1')}
                    </Col>
                  </Row>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col md="auto" lg="auto" sm="auto" xs="auto">
            <div className="board-area">
              <SnakeDot snakeDots={this.state.dots} />
              <Food food={this.state.food} />
            </div>
          </Col>
          <Col md="auto" lg="auto" sm="auto" xs="auto">
            <State curState={this.getState()} />
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col md="auto" lg="auto" sm="auto" xs="auto">
            <QTable curState={Q_table} found={visited} />
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col
            md="auto"
            lg="auto"
            sm="auto"
            xs="auto"
            style={{ 'margin-bottom': '50px' }}
          >
            <Card style={{ width: '610px' }}>
              <Card.Title
                style={{ 'margin-top': '20px', 'margin-bottom': '-5px' }}
              >
                <b>{t('qtable.title')}:</b>
              </Card.Title>
              <Card.Body>
                <ul>
                  <li>
                    <p>{t('qtable.p1')}</p>
                  </li>
                  <li>
                    <p>{t('qtable.p2')}</p>
                  </li>
                  <li>
                    <p>{t('qtable.p3')}</p>
                  </li>
                  <li>
                    <p>{t('qtable.p4')}</p>
                  </li>
                  <li>
                    <p>{t('qtable.p5')}</p>
                  </li>
                  <li>
                    <p>{t('qtable.p6')}</p>
                  </li>
                  <li>
                    <p>{t('qtable.p7')}</p>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
    );
  }
}

export default withTranslation()(Board);
