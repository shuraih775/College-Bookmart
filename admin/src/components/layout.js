import Navbar from "./Navbar";
import Foot from "./Foot";

const Layout = ({ children }) => {
    return (
      <div className="app">
        <Navbar />
        <div className=".content-container">{children}</div>
        <Foot />
      </div>
    );
  };

export default Layout;
  