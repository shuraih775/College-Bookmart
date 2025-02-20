import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/layout';
import PrintoutPage from './pages/printout';
import OrdersPage from './pages/orders';
import StationeryPage from './pages/stationery';
import Login from'./pages/login';
import Statistics from './pages/statistic';
import Transaction from './pages/transaction_history';


const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        
        <Routes>
          <Route exact path="/" element={<Login/>} />
          <Route path="/stationery" element={<StationeryPage/>} />
          <Route path="/printout" element={<PrintoutPage/>} />
          <Route path="/orders" element={<OrdersPage/>} />
          <Route path="/statistics" element={<Statistics/>} />
          <Route path="/transaction" element={<Transaction/>} />
          <Route path="/login" element={<Login/>} />
          
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
