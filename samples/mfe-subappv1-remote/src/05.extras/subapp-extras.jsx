import React from "react";
import { reduxLoadSubApp } from "subapp-redux";
import PropTypes from "prop-types";

const Extras = props => {
  return (
    <div className="container-fluid text-center">
      <p>Extras Extras Extras</p>
      <div>{props.message}</div>
    </div>
  );
};

Extras.propTypes = {
  message: PropTypes.string
};


export default loadSubApp({
  name: "Extras",
  Component,
  prepare: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          message: "what other buyers are looking at"
        });
      }, 1000);
    });
  }
});
