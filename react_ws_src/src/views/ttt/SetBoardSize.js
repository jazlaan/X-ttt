import React, { Component } from "react";

export default class SetBoardSize extends Component {
  constructor(props) {
    super(props);
    this.state = {
      size: 3,
    };
  }

  render() {
    return (
      <div id="SetBoardSize">
        <h1>Choose Board Size</h1>

        <div className="input_holder left">
          <label>Board Size (3-10): </label>
          <input
            type="number"
            min="3"
            max="10"
            value={this.state.size}
            onChange={(e) => this.setState({ size: e.target.value })}
            className="input"
          />
        </div>

        <button
          type="submit"
          onClick={() => this.props.onSetSize(parseInt(this.state.size))}
          className="button"
        >
          <span>
            Start Game <span className="fa fa-caret-right"></span>
          </span>
        </button>
      </div>
    );
  }
}
