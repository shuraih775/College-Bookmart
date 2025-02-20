import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Popup from './popup';
import { Link } from "react-router-dom";
import axios from "axios";
import PlusIcon from '../plusIcon';
import MinusIcon from '../minusIcon';
import '../styles/cart.css';
// import { onGooglePayButtonClicked, onGooglePayLoaded } from './paymentPage';
// import GooglePayButton from '@google-pay/button-react';


function CartPage() {
  const handleClosePopup = (doredirect) => {
    setShowPopup(false);
    if (doredirect) {
      navigate('/login');
    }
  };

  const [btnClicked, setBtnClicked] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [msg, setMsg] = useState("");
  const [doRedirect, setDoRedirect] = useState(false);
  const [status, setStatus] = useState(true);
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // useEffect(() => {
  //   onGooglePayLoaded();
  // }, []);
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart);

    const total = storedCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotalAmount(total);
  }, []);



  const handleCheckout = async (e) => {
  try {
    
    setBtnClicked(true);
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const formData = new FormData();

    
    cart.forEach((item, index) => {
      console.log(item.price);
      formData.append(`items[${index}][name]`, item.name);
      formData.append(`items[${index}][quantity]`, item.quantity);
      formData.append(`items[${index}][price]`, item.price);
      formData.append(`items[${index}][_id]`, item._id);
      formData.append(`items[${index}][type_]`, item.type_);
      formData.append(`items[${index}][subtype]`, JSON.stringify(item.subtypes));

    });


    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    
    formData.append('totalAmount', total);

    // onGooglePayButtonClicked(total)

    const token = JSON.parse(sessionStorage.getItem('token'));
    if(token==null){
      setMsg('Login to place orders.\n Redirecting to Login Page... ');
      setStatus(false);
      setDoRedirect(true);
    }
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });
    
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/orders`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }).then((response) => {
      if (response.status === 201) { 
        console.log(response.data.id)
        var options = {
          "key": `${process.env.REACT_APP_RAZOR_PAY_KEY}`, // Enter the Key ID generated from the Dashboard
          "amount": total * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
          "currency": "INR",
          "name": "Campus BookMart", //your business name
          "description": "Test Transaction",
          "image": "https://example.com/your_logo",
          "order_id": response.data.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
          "handler": async function (response){
            console.log(6)
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/orders/confirm`, {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }).then((confirmationResponse) => {
              if (confirmationResponse.status === 200) {
                setMsg("Order successfully placed and payment confirmed!");
                setStatus(true);
                setShowPopup(true);
                localStorage.removeItem('cart');
                setCartItems([]);
                setTotalAmount(0);
              }
            }).catch((error) => {
              console.error('Payment confirmation failed:', error);
              setMsg("Payment confirmation failed. Please contact support.");
              setStatus(false);
              setShowPopup(true);
            });
          },
          "notes": {
              "address": "Razorpay Corporate Office"
          },
          "theme": {
              "color": "#3399cc"
          }
      };
      var rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
              // alert(response.error.code);
              // alert(response.error.description);
              // alert(response.error.source);
              // alert(response.error.step);
              // alert(response.error.reason);
              // alert(response.error.metadata.order_id);
              // alert(response.error.metadata.payment_id);
              setBtnClicked(false);
      });
      rzp1.open();
      e.preventDefault();
        setBtnClicked(false);
        // setMsg("Order Succesfully Placed.")
        // setStatus(true);
        // setDoRedirect(false);
        // setShowPopup(true);
        // localStorage.removeItem('cart');
        // setCartItems([]);
        // setTotalAmount(0); 

      } else if (response.status === 401) {
        setBtnClicked(false);
        setMsg("Please login to order.")
        setStatus(false);
        setDoRedirect(true);
        setShowPopup(true);
        
      
      } else if (response.status === 500) {

        setMsg("Server error. Please try again later.");
        setBtnClicked(false);
        setStatus(false);
        setShowPopup(true);
      }
    }).catch((error) => {
      if (error.response.status === 401){
        setBtnClicked(false);
        setMsg("Please login to order.")
        setStatus(false);
        setDoRedirect(true);
        setShowPopup(true);
      }
      else if (error.response.status === 409){
        setBtnClicked(false);
        const msg = error.response.data.message;
        setMsg(msg);
        setStatus(false);
        setDoRedirect(false);
        setShowPopup(true);
      }
      else{
      setBtnClicked(false);
      setMsg("Server error. Please try again later.");
      setStatus(false);
      setDoRedirect(false);
      setShowPopup(true);
      }
    });

    
    
  } catch (error) {
    setBtnClicked(false);
    console.error('Error during checkout:', error);
  }
};

  const handleQuantityChange = (index, type) => {
    const updatedCartItems = [...cartItems];
    if (type === 'increment') {
      updatedCartItems[index].quantity++;
    } else if (type === 'decrement' && updatedCartItems[index].quantity > 1) {
      updatedCartItems[index].quantity--;
    }
    else if (type === 'decrement' && updatedCartItems[index].quantity === 1) {
      updatedCartItems.splice(index, 1);
    }
    setCartItems(updatedCartItems);
    localStorage.setItem('cart', JSON.stringify(updatedCartItems));
    const total = updatedCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotalAmount(total);
  };
 
  

  return (
    <div className='children'>
    <main className='cart-main-div'>
      <section id="cart-items">
        {cartItems.length > 0 ?(
          <>
        <div className='cart-items-desc'>
          <div className='cart-item-product'>Products</div>
          {/* <div>Price</div> */}
          <div className='cart-item-quantity'>Quantity</div>
          {/* <div className='units'>Total</div> */}
        </div>
        {cartItems.map((item, index) => (
          <div key={index} className="cart-item">
            <div className='cart-item-product'>
              <p className='cart-item-name'>{item.name}</p>
              <p className='cart-item-type'>{item.type_}</p>
              <p className='cart-item-subtype'>{Object.values(item.subtypes).join(', ')}</p>
              <p className='cart-item-price'>per piece Rs.{item.price}</p>

            </div>
            {/* <div>Rs. {item.price}</div> */}
            <div className='cart-item-quantity'>
              
              
              <button
                        className="product-subtract-btn"
                        onClick={() => handleQuantityChange(index, 'decrement')} 
                      >
                        <MinusIcon />
                      </button>
              
                      <div className='quantity-cart-disp'>
              <p>{item.quantity}</p>
              </div>
              
                      <button
                        className="product-add-btn"
                        onClick={() => handleQuantityChange(index, 'increment')}
                      >
                        <PlusIcon />
                      </button>
              </div>
            
            {/* <div className='units'>Rs. {item.price * item.quantity}</div> */}
            
          </div>
        ))}
        <div id="cart-total">
          <p>Bill Amount: <span>Rs {totalAmount}</span></p>
        </div>
        </>
        ):(
          <div className='cart-alt-div'>
          <p>No items in the Cart.</p>
          <Link className=" btn-1" to="/stationery">Go to Stationery</Link>
          </div>
        )}
        <div className="checkout">
      {cartItems.length > 0 && (
        !btnClicked?

          (<>
          
          <button id="checkout-btn" className='btn-1' onClick={handleCheckout}>Checkout</button></>)
          :
          (
            <button className='btn-1' style={{backgroundColor:'#e0e084'}} type="button">
            <div className="loader-cart"></div>
          </button>
          )
      
        
      )}
      
      </div>
      </section>
      
      
      {showPopup && (
        <Popup
          message={msg}
          onClose={handleClosePopup}
          status={status}
          doRedirect={doRedirect}
        />
      )}
    </main>
    </div>
  );
}

export default CartPage;
