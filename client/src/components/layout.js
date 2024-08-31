
import NN from "./Navbar";
import Foot from "./Foot";

const Layout = ({ children }) => {
    return (
      <div className="app">
        
        <NN />
        <div className=".content-container">{children}</div>
        <Foot />
      </div>
    );
  };

export default Layout;
  