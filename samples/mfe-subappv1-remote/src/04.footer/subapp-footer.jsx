import { React, loadSubApp } from "subapp-react";
import PropTypes from "prop-types";

const Footer = props => {
  return (
    <footer className="container-fluid text-center">
      <p>{props.title}</p>
      <form className="form-inline">
        Get deals:
        <input type="email" className="form-control" size="50" placeholder="Email Address" />
        <button type="button" className="btn btn-danger">
          Sign Up
        </button>
      </form>
    </footer>
  );
};

Footer.propTypes = {
  title: PropTypes.string
};

export default loadSubApp({
  name: "Footer",
  Component: Footer,
  prepare: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          title: "Online Store Copyright"
        });
      }, 2000);
    });
  }
});
