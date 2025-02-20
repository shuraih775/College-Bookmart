import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {useNavigate } from "react-router-dom";
import Popup from './popup';
import "bootstrap/dist/css/bootstrap.min.css";

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
  const navigate = useNavigate();
  useEffect(()=>{
    try{
      const token = localStorage.getItem('adminToken');
      if(token){
        navigate('/stationery');
      }
      
    }
    catch(error){
        console.log(error);
    }
  },[navigate]);
  const handleClosePopup = (doredirect) => {
    setShowPopup(false);
    if (doredirect) {
      window.location.href = '/stationery'; 
    }
  };

  const { email, password } = formData;

  const handleChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnClicked(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/loginAdmin`, {
        email,
        password
      });

      if (response.status === 200) {
        const { token } = response.data;
        localStorage.setItem('adminToken', JSON.stringify(token));
        setMsg("Login Successful!");
        setStatus(true);
        setDoRedirect(true);
        setShowPopup(true);
      } else {
        setMsg("Server error. Please try again later.");
        setBtnClicked(false);
        setShowPopup(true);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setMsg("Invalid credentials");
      } else {
        setMsg("Unable to login. Try again later!");
      }
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
          placeholder="Email"
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
       {!btnClicked?
        (
        <button className='btn-1' type="submit">Login</button>)
        :
        (
          <button className='btn-1' style={{backgroundColor:'#e0e084'}} type="button">
            <div className="loader"></div>
          </button>)
        
        }
      </form>
      
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
