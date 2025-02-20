import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loading from './Loading';
import Popup from './popup';
import SadIcon from '../sadicon';
import '../styles/orders.css';

function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedin, setLoggedin] = useState(false);
  const [doRedirect, setDoRedirect] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(false);
  const [cancelBtnsClicked, setCancelBtnsClicked] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleClosePopup = (doredirect) => {
    setShowPopup(false);
    if (doredirect) {
      navigate('/login');
    }
  };

  const fetchOrders = async () => {
    try {
      const token = JSON.parse(sessionStorage.getItem('token'));
      if (token) {
        setLoggedin(true);
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/orders/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const sortedOrders = response.data.orders.reverse();
        setOrders(sortedOrders);
        setLoading(false);
      } 
      else{
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      setMsg("Something went wrong. Try again later!");
      setStatus(false);
      setDoRedirect(false);
      setShowPopup(true);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      setCancelBtnsClicked((prev) => [...prev, orderId]); 
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/orders/${orderId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${JSON.parse(sessionStorage.getItem('token'))}`
        }
      });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: 'canceled' } : order
        )
      );
      setCancelBtnsClicked((prev) => prev.filter((id) => id !== orderId)); 
    } catch (error) {
      setMsg("Couldn't cancel order with order Id:"+orderId.slice(-5)+" Something went wrong!");
      setStatus(false);
      setDoRedirect(false);
      setShowPopup(true);
      setCancelBtnsClicked((prev) => prev.filter((id) => id !== orderId)); 
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId((prevId) => (prevId === orderId ? null : orderId));
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  return (
    <div className='children'>
    <div className="orders-container">
      
      {loading ? (
        <>
        <h1>All Orders</h1>
        <Loading /></>
        
      ) : !loggedin ? (
        <div className='order-alt-div'>
          <h1>All Orders</h1>
        <p >Please login to view orders.</p></div>
      ):
      orders.length === 0?(
        <div className='order-alt-div'>
          <h1>All Orders</h1>
          No orders <SadIcon/></div>
      ):(
        <ul>
          {orders.map((order, index) => (
            <li key={index} className="order">
              <div className="order-details">
                <div className="orders-visible">
                <h3>Order Date: {new Date(order.order_date).toLocaleString()}</h3>
                <h3>Order Id: {(order._id).slice(-5)}</h3>
                <p className="order-status">
                  Status: {order.status === 'pending' ? 'processing...' : order.status === 'readytopick' ? <span style={{ color: 'green' }}>Ready to pick</span> : order.status === 'canceled' ? (<span style={{ color: 'red' }}>Canceled</span>) : order.status}
                </p>
                <div className="order-btns">
                <button className='btn-1 expansion-btn' onClick={() => toggleOrderDetails(order._id)}>
                  {expandedOrderId === order._id && expandedOrders[order._id] ? 'Less' : 'More...'}
                </button>
                {(order.status === 'pending' || order.status === 'readytopick') && (
                  <button
                    className='btn-3 expansion-btn'
                    onClick={() => cancelOrder(order._id)}
                    style={{ backgroundColor: cancelBtnsClicked.includes(order._id) ? 'lightcoral' : '' }}
                    disabled={cancelBtnsClicked.includes(order._id)}
                  >
                    Cancel
                  </button>
                )}
                </div>
                
                </div>
                
                {expandedOrderId === order._id && expandedOrders[order._id] && (
                  <div>
                    <ul className="order-items">
                      <div className='order-item-desc'>
                        <div className='order-item-product'>Products</div>
                        <div className='order-item-quantity'>Quantity</div>
        
                      </div>
                      {order.order_items.map((item, idx) => (
                        
                        <li key={idx} className="order-item">
                         
                          <div className='order-item-product'>
              <p className='order-item-name'>{item.name}</p>
              <p className='order-item-type'>{item.type_}</p>
              <p className='order-item-subtype'>{Object.values(item.subtypes).join(', ')}</p>
              <p className='order-item-price'>per piece Rs.{item.price}</p>

            </div>
                          <div className='order-item-quantity'>{item.quantity}</div>
                        </li>
                      ))}
                    </ul>
                    <p><b><i>Bill Amount :</i></b>{'\u00A0\u00A0\u00A0'} Rs. {order.bill_amt}</p>
                  </div>
                )}

              
              </div>
            </li>
          ))}
        </ul>
      )}
      {showPopup && (
        <Popup
          message={msg}
          onClose={handleClosePopup}
          status={status}
          doRedirect={doRedirect}
        />
      )}
    </div>
    </div>
  );
}

export default Order;
