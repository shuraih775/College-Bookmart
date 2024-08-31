import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavDropdown from 'react-bootstrap/NavDropdown';
import HomeIcon from '../homeIcon';
import StationeryIcon from '../stationeryIcon';
import PrintIcon from '../printIcon';
import CartIcon from '../cartIcon';
import OrderIcon from '../orderIcon';
import MenuIcon from '../menuIcon';
import UserIcon from '../userIcon';

function CollapsibleExample() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [classes, setClasses] = useState('nav');

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

  useEffect(() => {
    const handleStorageChange = () => {
      const storedUsername = sessionStorage.getItem('username');
      setUsername(storedUsername || '');
    };
    handleStorageChange();
  }, []);

  const handleLogout = () => {
    handleLinkClick();
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('token');
    setUsername('');
    navigate('/login');
  };

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
            <Link className="nav-link" onClick={handleLinkClick} to="/">
            <div className='nav-icon-small-window'>
                <HomeIcon />
              </div>
              Home
              <div className='nav-icon'>
                <HomeIcon />
              </div>
            </Link>
          </div>
          <div className='nav-block'>
            <Link className="nav-link" onClick={handleLinkClick} to="/stationery">
            <div className='nav-icon-small-window' style={{ paddingBottom: '0.3rem' }}>
                <StationeryIcon />
              </div>
              Stationery
              <div className='nav-icon' style={{ paddingBottom: '0.3rem' }}>
                <StationeryIcon />
              </div>
            </Link>
          </div>
          <div className='nav-block'>
            <Link className="nav-link" onClick={handleLinkClick} to="/printout">
            <div className='nav-icon-small-window'>
                <PrintIcon />
              </div>
              Printout
              <div className='nav-icon'>
                <PrintIcon />
              </div>
            </Link>
          </div>
          <div className='nav-block'>
            <Link className="nav-link" onClick={handleLinkClick} to="/cart">
            <div className='nav-icon-small-window'>
                <CartIcon />
              </div>
              Cart
              <div className='nav-icon'>
                <CartIcon />
              </div>
            </Link>
          </div>
          <div className='nav-block'>
            <Link className="nav-link" onClick={handleLinkClick} to="/orders">
            <div className='nav-icon-small-window'>
                <OrderIcon />
              </div>
              Orders
              <div className='nav-icon'>
                <OrderIcon />
              </div>
            </Link>
          </div>
          {username ? (
            <div className='nav-block'>
              
              <NavDropdown title={username} id="username-dropdown">
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                <NavDropdown.Item onClick={()=>{navigate('/changePassword')}}>Change Password</NavDropdown.Item>
                <NavDropdown.Item onClick={()=>{navigate('/deleteAccount')}}>Delete Account</NavDropdown.Item>
              </NavDropdown>
              
            </div>
          ) : (
            <div className='nav-block'>
              
              <Link className="nav-link" onClick={handleLinkClick} to="/login">
              <div className='nav-icon-small-window'>
              <UserIcon/>
              </div>
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
