import React from 'react';
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
  return (
    <BrowserRouter>
      <Layout>
        
        <Routes>
          <Route exact path="/" element={<HomePage/>} />
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
