import React,{useEffect} from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/layout';
import HomePage from './pages/HomePage';
import PrintoutPage from './pages/printout';
import CartPage from './pages/cart';
import LoginForm from './pages/login';
import StationeryPage from './pages/stationery';
import SignUpForm from './pages/signup';
import OrdersPage from './pages/orders';
import ChangePasswordPage from './pages/changePassword';
import ResetPasswordPage from './pages/resetPassword';
import DeleteAccountPage from './pages/deleteAccount';

const App = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []); 
  
  return (
    <BrowserRouter>
      <Layout>
        
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/stationery" element={<StationeryPage/>} />
          <Route path="/printout" element={<PrintoutPage/>} />
          <Route path="/cart" element={<CartPage/>} />
          <Route path="/orders" element={<OrdersPage/>} />
          <Route path="/login" element={<LoginForm/>} />
          <Route path="/signup" element={<SignUpForm/>} />
          <Route path="/changePassword" element={<ChangePasswordPage/>} />
          <Route path="/resetPassword" element={<ResetPasswordPage/>} />
          <Route path="/deleteAccount" element={<DeleteAccountPage/>} />
          
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
