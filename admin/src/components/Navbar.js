import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavDropdown from 'react-bootstrap/NavDropdown';
// import HomeIcon from '../homeIcon';
import StationeryIcon from '../stationeryIcon';
import PrintIcon from '../printIcon';
// import CartIcon from '../cartIcon';
import OrderIcon from '../orderIcon';
import MenuIcon from '../menuIcon';
import UserIcon from '../userIcon';
import TransactionIcon from '../transactionIcon';
import StatisticIcon from '../statisticIcon';
import '../styles/Navbar.css';

function CollapsibleExample() {
  // const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [classes, setClasses] = useState('nav');
  const [token , setToken] = useState(null);
  const handleLinkClick = () => {
    setExpanded(false); 
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setClasses('nav scrolled-nav');
      } else {
        setClasses('nav');
      }
    };

    window.addEventListener('scroll', handleScroll);

    
    handleScroll();


    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // useEffect(() => {
  //   const handleStorageChange = () => {
  //     const storedUsername = sessionStorage.getItem('username');
  //     setUsername(storedUsername || '');
  //   };
  //   handleStorageChange();
  // }, []);

  const handleLogout = () => {
    handleLinkClick();
    setToken(null);
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  useEffect(()=>{
    setToken(localStorage.getItem('adminToken') || null)
  },[])

  return (
    <div className='nav-container'>
      <div className={classes}>
        <div className='title'>
          College BookMart
        </div>
        <button className='menu-button' onClick={() => setExpanded(!expanded)}>
          <MenuIcon />
        </button>
        <div className={`nav-links ${expanded ? 'expanded' : ''}`}>
          
          <div className='nav-block'>
            <Link className="nav-link" onClick={handleLinkClick} to="/stationery">
              Stationery
              <div className='nav-icon' style={{ paddingBottom: '0.3rem' }}>
              <StationeryIcon />
              </div>
            </Link>
          </div>
          <div className='nav-block'>
            <Link className="nav-link" onClick={handleLinkClick} to="/printout">
              Printout
              <div className='nav-icon'>
                <PrintIcon />
              </div>
            </Link>
          </div>
          
          <div className='nav-block'>
            <Link className="nav-link" onClick={handleLinkClick} to="/orders">
              Orders
              <div className='nav-icon'>
                <OrderIcon />
              </div>
            </Link>
          </div>
          <div className='nav-block'>
          <Link className="nav-link" to="/transaction" onClick={handleLinkClick}>
          Transaction
              <div className='nav-icon'>
                <TransactionIcon />
              </div>
            </Link>
          </div>
          <div className='nav-block'>
          <Link className="nav-link" to="/statistics" onClick={handleLinkClick}>
          Statistics
              <div className='nav-icon'>
                <StatisticIcon />
              </div>
            </Link>
          </div>

              {token ? (
                <div className='nav-block'>
                  <NavDropdown title='admin' id="username-dropdown">
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
              </div>):(
                <div className='nav-block'>
                <Link className="nav-link" to="/Login" onClick={handleLinkClick}>
                Login
                <div className='nav-icon'>
              <UserIcon/>
              </div>
              </Link>
              </div>
              )}
              
            
        </div>
      </div>
    </div>
  );
}

export default CollapsibleExample;
