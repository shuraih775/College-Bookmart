import React, { useState } from 'react';
import axios from 'axios';
import Popup from './popup';
import { useNavigate } from 'react-router-dom'; 
import '../styles/resetPassword.css';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [status, setStatus] = useState(false);
  const [msg, setMsg] = useState("");
  const [btnClicked, setBtnClicked] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setBtnClicked(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/send-reset-code`, { email });
      if (response.status === 200) {
        setMsg(`Verification code sent to ${email}`);
        setIsCodeSent(true);
        setStatus(true);
        setShowPopup(true);
        setBtnClicked(false);
      }
    } catch (error) {
      setMsg("Server error. Please try again.");
      setShowPopup(true);
      setBtnClicked(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setBtnClicked(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify-reset-code`, { email, code });
      if (response.status === 200) {
        const { token } = response.data;
        sessionStorage.setItem('token', token); 
        setMsg("Code verified. Redirecting to change password...");
        setShowPopup(true);
        setStatus(true);
        setTimeout(() => {
          navigate('/changePassword'); 
        }, 2000);
      } else {
        setMsg("Invalid code. Please try again.");
        setShowPopup(true);
        setBtnClicked(false);
      }
    } catch (error) {
      setMsg("Server error. Please try again.");
      setShowPopup(true);
      setBtnClicked(false);
    }
  };

  return (
    <div className="password-reset-container">
      <div className="password-reset-form">
        <h2>Password Reset</h2>
        {!isCodeSent ? (
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>
            {!btnClicked ? (
              <button className='btn-1' type="submit">
                Send Verification Code
              </button>
            ) : (
              <button className='btn-1' style={{ backgroundColor: '#e0e084' }} type="button">
                <div className="loader"></div>
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit}>
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                type="text"
                id="code"
                name="code"
                value={code}
                onChange={handleCodeChange}
                required
                placeholder="Enter the verification code"
              />
            </div>
            {!btnClicked ? (
              <button className='btn-1' type="submit">
                Verify Code
              </button>
            ) : (
              <button className='btn-1' style={{ backgroundColor: '#e0e084' }} type="button">
                <div className="loader"></div>
              </button>
            )}
          </form>
        )}
      </div>
      {showPopup && (
        <Popup
          message={msg}
          onClose={() => { setShowPopup(false); }}
          status={status}
          doRedirect={false}
        />
      )}
    </div>
  );
};

export default PasswordReset;
