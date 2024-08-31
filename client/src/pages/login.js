import React, { useState } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import Popup from './popup';
import '../styles/login.css';

const LoginForm = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [doRedirect, setDoRedirect] = useState(false);
  const [status, setStatus] = useState(false);
  const [msg, setMsg] = useState("");
  const [btnClicked, setBtnClicked] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleClosePopup = (doredirect) => {
    setShowPopup(false);
    if (doredirect) {
      window.location.href = '/';
    }
  };

  const { email, password } = formData;

  const handleChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnClicked(true);
    
    // Regular expression for validating email format
    const emailRegex = /^[a-z]+\.[a-z]+(\d{2})?@bmsce\.ac\.in$/;


    if (!emailRegex.test(email)) {
      setMsg("Invalid email format. Please use the format 'username.dept<year>@bmsce.ac.in'.");
      setBtnClicked(false);
      setShowPopup(true);
      return; 
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.status === 200) {
        try {
          const { token } = await response.json();
          sessionStorage.setItem('token', JSON.stringify(token));

          if (token) {
            const res = await axios.get('http://localhost:5000/api/auth/fetchusername', {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            const fetchedUsername = res.data.username;
            sessionStorage.setItem('username', fetchedUsername);
          }

          window.location.href = '/';
        } catch {
          setMsg("Unable to login. Try again later!");
          setBtnClicked(false);
          setShowPopup(true);
        }
      } else if (response.status === 400) {
        setMsg("Invalid credentials");
        setBtnClicked(false);
        setShowPopup(true);
      } else {
        setMsg("Server error. Please try again later.");
        setBtnClicked(false);
        setShowPopup(true);
      }

    } catch (error) {
      setMsg("Unable to login. Try again later!");
      setBtnClicked(false);
      setShowPopup(true);
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className='content children'>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className='container'>
        <input
          type="email"
          name="email"
          value={email}
          onChange={handleChange}
          placeholder="username.dept<year>@bmsce.ac.in"
          required
        />
        <input
          type="password"
          name="password"
          value={password}
          onChange={handleChange}
          placeholder="Password"
          required
        />
        {!btnClicked ? (
          <button className='btn-1' type="submit">Login</button>
        ) : (
          <button className='btn-1' style={{ backgroundColor: '#e0e084' }} type="button">
            <div className="loader"></div>
          </button>
        )}
      </form>
      <div>
        <p> Forgot Password?{'\n'}<Link className="redirect-link" to="/resetPassword"><u>Reset Password</u></Link></p>
      </div>
      <div>
        <p> Create new Account?{'\n'}<Link className="redirect-link" to="/signup"><u>Signup</u></Link></p>
      </div>
      {showPopup && (
        <Popup
          message={msg}
          onClose={handleClosePopup}
          status={status}
          doRedirect={doRedirect}
        />
      )}
    </div>
  );
};

export default LoginForm;
