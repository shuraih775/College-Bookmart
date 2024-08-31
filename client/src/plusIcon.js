import * as React from "react";
const SVGComponent = (props) => (
  <svg
    height="15px"
    id="Layer_1"
    style={{
      enableBackground: "new 0 0 512 512",
    }}
    viewBox="0 0 512 512"
    width="15px"
    xmlSpace="preserve"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    {...props}
  >
    <g>
      <path d="M384,265H264v119h-17V265H128v-17h119V128h17v120h120V265z" />
    </g>
  </svg>
);
export default SVGComponent;
