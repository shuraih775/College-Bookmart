import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import Popup from './popup';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import '../styles/signup.css';

const SignUpForm = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(false);
  const [doRedirect, setDoRedirect] = useState(false);
  const [otpSent, setOtpSent] = useState(false); 
  const [showVpaModal, setShowVpaModal] = useState(false);
  const [btnClicked, setBtnClicked] = useState(false);
  const [vpa, setVPA] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    otp: ''
  });

  const navigate = useNavigate();
  const { email, username, password, otp } = formData;

  const handleClosePopup = (doredirect) => {
    setShowPopup(false);
    if(doredirect){
      navigate('/login');
    }
  };

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOTP = async () => {
    try {
      setBtnClicked(true);
      const emailRegex = /^[a-z]+\.[a-z]+(\d{2})?@bmsce\.ac\.in$/;
    if (!emailRegex.test(email)) {
      setMsg("Invalid email format. Please use the format 'username.dept<year>@bmsce.ac.in'.");
      setBtnClicked(false);
      setShowPopup(true);
        return;
        }
      const response = await axios.post('http://localhost:5000/api/auth/send-otp', { email, username});
      
      if (response.status === 201) {
        setOtpSent(true);
        setBtnClicked(false);
        setMsg("OTP sent successfully");
        setStatus(true);
        setShowPopup(true);
      } else {
        setMsg(response.data.msg);
        setBtnClicked(false);
        setStatus(false);
        setShowPopup(true);
        setOtpSent(false);
      }
    } catch (error) {
      if(error.response.data.message === "Username already exists"){
        setBtnClicked(false);
      setMsg("Username already exists. Please choose some other username");
      setStatus(false);
      setShowPopup(true);
      }
      else if(error.response.data.message === "User already exists"){
        setBtnClicked(false);
      setMsg("User already exists with this mail Id");
      setStatus(false);
      setShowPopup(true);
      }
      else{
        console.error('Error sending OTP:', error);
      setBtnClicked(false);
      setMsg("Failed to send OTP");
      setStatus(false);
      setShowPopup(true);
      }
    }
  };
  const handleModalHide = ()=>{
    setShowVpaModal(false);
    navigate('/login');
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnClicked(true);
    
    try {
      const emailRegex = /^[a-z]+\.[a-z]+(\d{2})?@bmsce\.ac\.in$/;
    if (!emailRegex.test(email)) {
      setMsg("Invalid email format. Please use the format 'username.dept<year>@bmsce.ac.in'.");
      setBtnClicked(false);
      setShowPopup(true);
        return;
        }
      const response = await axios.post('http://localhost:5000/api/auth/signup', {
        email,
        username,
        password,
        otp
      });

      if (response.status === 201) {
        // setMsg("Signup successful");
        // setStatus(true);
        // setDoRedirect(true);
        // setShowPopup(true);
        setBtnClicked(false);
        setShowVpaModal(true);
      } else if (response.status === 400) {
        setMsg(response.data.msg);
        setStatus(false);
        setShowPopup(true);
        setBtnClicked(false);
      } else {
        setMsg("Server error. Please try again later.");
        setStatus(false);
        setShowPopup(true);
        setBtnClicked(false);
      }
    } catch (error) {
      if(error.response.data.message === "Username already exists"){
        setBtnClicked(false);
      setMsg("Username already exists. Please choose some other username");
      setStatus(false);
      setShowPopup(true);
      }
      else if(error.response.data.message === "User already exists"){
        setBtnClicked(false);
      setMsg("User already exists with this mail Id");
      setStatus(false);
      setShowPopup(true);
      }
      else{
        console.error('Error sending OTP:', error);
      setBtnClicked(false);
      setMsg("Failed to send OTP");
      setStatus(false);
      setShowPopup(true);
      }
    }
  };

  const handleVpaSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/vpa', { email, vpa });
      if (response.status === 200) {
        setShowVpaModal(false);
        navigate('/login');
      } else {
        console.error('Failed to save VPA');
      }
    } catch (error) {
      console.error('Error submitting VPA:', error);
    }
  };

  return (
    <div className='content children'>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          value={email}
          onChange={handleChange}
          placeholder="username.dept<year>@bmsce.ac.in"
          required
        />
        <input
          type="text"
          name="username"
          value={username}
          onChange={handleChange}
          placeholder="Username"
          required
        />
        <input
          type="password"
          name="password"
          value={password}
          onChange={handleChange}
          placeholder="Password"
          minLength="6"
          required
        />
        {otpSent ? (
          <>
            <input
              type="text"
              name="otp"
              value={otp}
              onChange={handleChange}
              placeholder="Enter OTP"
              required
            />
            {!btnClicked ? (
              <button className='btn-1' type="submit">Register</button>
            ) : (
              <button className='btn-1' style={{backgroundColor:'#e0e084'}} type="button">
                <div className="loader"></div>
              </button>)}
          </>
        ) : 
          !btnClicked ? (
            <button className='btn-1' type="button" onClick={handleSendOTP}>Send OTP</button>
          ) :(
            <button className='btn-1' style={{backgroundColor:'#e0e084'}} type="button">
              <div className="loader"></div>
            </button>)}
      </form>
      {showPopup && (
        <Popup
          message={msg}
          onClose={handleClosePopup}
          status={status}
          doRedirect={doRedirect}
        />
      )}
      <Modal show={showVpaModal} onHide={handleModalHide}>
        <Modal.Header closeButton>
          <Modal.Title>Enter Your VPA</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please enter your VPA (Virtual Payment Address) now or before your first payment/transaction:</p>
          <input
            type="text"
            value={vpa}
            onChange={(e) => setVPA(e.target.value)}
            placeholder="example@bank or user@upi"
            required
            className="form-control"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalHide}>
            Skip
          </Button>
          <Button variant="primary" onClick={handleVpaSubmit}>
            Save VPA
          </Button>
        </Modal.Footer>
      </Modal>
      <div style={{ marginTop: '1.5rem' }}>
        <p>Already have an account?{'\n'}<Link className="redirect-link" to="/login"><u>Login</u></Link></p>
      </div>
    </div>
  );
};

export default SignUpForm;
