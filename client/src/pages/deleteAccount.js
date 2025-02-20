import React, { useState } from 'react';
import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
import '../styles/deleteAccount.css';

const DeleteAccount = () => {
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [btnClicked, setBtnClicked] = useState(false);
  // const navigate = useNavigate();
  const handleChange = (e) => {
    setConfirmation(e.target.value);
    setError('');
  };

  const handleDelete = async () => {
    setBtnClicked(true);
    if (confirmation.toLowerCase() === 'delete my account') {
      try {
        const token = JSON.parse(sessionStorage.getItem('token'));
        const response = await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/auth/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('token');
          setSuccess(true);
          setBtnClicked(false);
          window.location.href = '/signup';
        } else {
          setError('Failed to delete account. Please try again.');
          setBtnClicked(false);
        }
      } catch (err) {
        setError('Failed to delete account. Please try again.');
        setBtnClicked(false);
        console.error(err);
      }
    } else {
      setBtnClicked(false);
      setError('Please type "delete my account" to confirm.');
    }
  };

  return (
    <div className="delete-account-container">
      {success ? (
        <div className="success-message">
          <h2>Your account has been successfully deleted.</h2>
        </div>
      ) : (
        <div className="delete-account-form">
          <h2>Delete Account</h2>
          <p>To confirm the deletion of your account, please type <strong>"delete my account"</strong> below.</p>
          <input
            type="text"
            value={confirmation}
            onChange={handleChange}
            placeholder="Type here..."
            className="confirmation-input"
          />
          {error && <p className="error-message">{error}</p>}
          
          {!btnClicked ? (
          <button onClick={handleDelete} className="btn-3">
          Confirm Deletion
        </button>
        ) : (
          <button className='btn-3' style={{ backgroundColor: '#lightCoral' }} type="button">
            <div className="loader"></div>
          </button>
        )}
        </div>
      )}
    </div>
  );
};

export default DeleteAccount;
