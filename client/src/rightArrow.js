import * as React from "react";
const SVGComponent = (props) => (
  <svg
    width={26}
    height={26}
    viewBox="0 0 26 26"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M9 6L15 12L9 18" stroke="#222222" strokeWidth={2} />
  </svg>
);
export default SVGComponent;
