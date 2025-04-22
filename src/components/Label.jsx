import React from "react";

const Label = ({ htmlFor, children, required = false }) => (
  <label htmlFor={htmlFor}>
    {children}
    {required && <span style={{ color: "red", marginLeft: "4px" }}>*</span>}
  </label>
);

export default Label;
