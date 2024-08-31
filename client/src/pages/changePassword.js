import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Popup from './popup';
import '../styles/resetPassword.css';


  
const PasswordChange = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPopup, setShowPopup] = useState(false);
const [doRedirect, setDoRedirect] = useState(false);
const [status, setStatus] = useState(false);
const [msg, setMsg] = useState("");
const [btnClicked, setBtnClicked] = useState(false);

const navigate = useNavigate();

  const handleClosePopup = (doredirect) => {
    setShowPopup(false);
    if (doredirect) {
      navigate('/');
    }
  };
  const handleConfirmNewPasswordChange =  (e) => {
    setConfirmNewPassword(e.target.value);
}
  const handleNewPasswordChange =  (e) => {
    setNewPassword(e.target.value);
}

const handleSubmit = async(e) => {
    e.preventDefault();
    setBtnClicked(true);
    if(newPassword !== confirmNewPassword){
        setMsg("Passwords Do not match!");
        setStatus(false);
        setDoRedirect(false);
        setBtnClicked(false);
        setShowPopup(true);
        
    }
    try{
       const token =  sessionStorage.getItem('token');
       if(!token){
        return;
       }
    const res = await axios.put('http://localhost:5000/api/auth/change-password',{newPassword}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    if(res.status === 200){
        setMsg("Password changed successfully");
        setStatus(true);
        setDoRedirect(true);
        setShowPopup(true);
        // setBtnClicked(false);
    }
    }
catch(error){
    setBtnClicked(false);
    setMsg("Server Error");
    setStatus(false);
    setDoRedirect(false);
    setShowPopup(true);
  };
  };

  

  return (
    <div className="password-reset-container">
      <div className="password-reset-form">
        <h2>Password Change</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
           
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={handleNewPasswordChange}
              required
              placeholder="Enter your new password"
            />
            <label htmlFor="currentPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              value={confirmNewPassword}
              onChange={handleConfirmNewPasswordChange}
              required
              placeholder="Enter your new password once more"
            />
          </div>

          
          {!btnClicked ? (
          <button className='btn-1' type="submit" >
          Change Password
        </button>
        ) : (
          <button className='btn-1' style={{ backgroundColor: '#e0e084' }} type="button">
            <div className="loader"></div>
          </button>
        )}
        </form>
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

export default PasswordChange;
