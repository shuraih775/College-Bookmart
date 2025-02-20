import React, { useState, useEffect, useCallback,useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Modal, Button, Form } from 'react-bootstrap';
import Loading from './Loading';
import Popup from'./popup';
import '../styles/orders.css';
import SearchIcon from '../searchIcon';

function OrderPage() {
  const [ordersByUser, setOrdersByUser] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [code, setCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // const [newOrderProducts, setNewOrderProducts] = useState([]);
  // const [newOrderPrice, setNewOrderPrice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productIntermediateSearchTerm, setProductIntermediateSearchTerm] = useState('');
  const [modalScreen, setModalScreen] = useState('productSelection'); 
  const [showPopup, setShowPopup] = useState(false);
  const [doRedirect, setDoRedirect] = useState(false);
  const [status, setStatus] = useState(false);
  const [msg, setMsg] = useState("");
  const [page,setPage] = useState(1);
  const fetchedProductsPage = useRef(0);
  const totalManualProducts = useRef(0);
  // const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  // const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  const navigate = useNavigate();

  const handleClosePopup = (doredirect) => {
    setShowPopup(false);
    if (doredirect) {
      navigate('/login');
    }
  };
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setPage((prevPage) => prevPage + 1);
      fetchProducts(productIntermediateSearchTerm.trim(), page + 1);
    }
  };
  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/orders/${statusFilter}`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
        }
      });
      const orders = response.data.orders;
      setOrdersByUser(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setMsg("Couldn't fetch orders!");
      setDoRedirect(false);
      setStatus(false);
      setShowPopup(true);
    }
  }, [statusFilter]);

  const fetchProducts = useCallback(async (term, currPage, productsPerPage =parseInt(window.innerWidth / 180 * 2)) => {
    try {
      const Page = currPage || page;
      // console.log(Page,currPage);
      if (fetchedProductsPage.current >= Page) {
        return;
      }
      fetchedProductsPage.current = Page;
      
      
  

      const searchTerms = term || productSearchTerm;
      const queryParams = new URLSearchParams({
        page:Page,
        limit: productsPerPage,
        searchName: searchTerms,
        filters:JSON.stringify({
          type: 'all',
          subtypes: {}
        })
      });
      const token = JSON.parse(localStorage.getItem('adminToken'));
          if (!token) {
            console.error('Authorization token not found');
            return;
          }
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/product/available?${queryParams.toString()}`);
      const productsWithImageUrl = await Promise.all(response.data.products.map(async product => {
        const imgResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/product/${product._id}/image`, { responseType: 'blob' });
        const imageUrl = URL.createObjectURL(imgResponse.data);
        return { ...product, img: imageUrl };
      }));

      setProducts(prevProducts => [...prevProducts, ...productsWithImageUrl]);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [page,productSearchTerm]);

  const handleSearch = () => {
    setProducts([]);
    // filteredProducts.current = [];
    setPage(1);
    fetchedProductsPage.current = 0;
    if (productIntermediateSearchTerm.trim() === '') {
      // Reset the search term and fetch all products
      setProductSearchTerm('');
      fetchProducts('');
    } else {
      // Apply the search term and fetch products
      setProductSearchTerm(productIntermediateSearchTerm.trim());
      fetchProducts(productIntermediateSearchTerm.trim());
    }
    
  };
  useEffect(() => {
    fetchOrders();
  }, [statusFilter, fetchOrders]);

  useEffect(() => {
    if (showModal) {
      fetchProducts();
    }
  }, [showModal, fetchProducts]);

  const DisplayProductImage = ({ productName,productId, img }) => {
    const [imageLoading, setImageLoading] = useState(!img);

    useEffect(() => {
      if (!img) {
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/product/${productId}/image`, { responseType: 'blob' }, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
          }
        }).then(response => {
            const imageUrl = URL.createObjectURL(response.data);
            localStorage.setItem(productName, imageUrl);
            setImageLoading(false);
          })
          .catch(error => {
            setImageLoading(false);
          });
      } else {
        setImageLoading(false);
      }
    }, [productId, img,productName]);

    return imageLoading ? <div><Loading /></div> : (
      <img
        src={img}
        alt={productName}
        className='product-card-img'
      />
    );
  };

  const addNewManualOrder = async () => {
    try {
      // Prepare the order data
      const orderItems = products
        .filter(product => productQuantities[product._id] > 0)
        .map(product => ({
          _id: product._id,
          name: product.name,
          type_:product.type,
          subtypes:product.subtypes,
          price: product.sellingprice,
          quantity: productQuantities[product._id],
        }));

      const orderData = {
        order_items: orderItems,
        bill_amt: calculateTotalPrice(),
      };
      console.log(orderItems)

      
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/orders/manualOrder`, orderData, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
        }
      });
      if (response.status === 200) {
        setShowModal(false);
        setModalScreen('productSelection');
        setProductQuantities({});
        setProductSearchTerm('');
        setMsg("Order recorded Succesfully!");
        setDoRedirect(false);
      setStatus(true);
      setShowPopup(true);
      }
    } catch (error) {
      console.error('Error adding new manual order:', error);
      setMsg("Couldn't record order!");
      setDoRedirect(false);
      setStatus(false);
      setShowPopup(true);
    }
  };

  const markAsComplete = async (orderId) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/orders/${orderId}/complete`, { code }, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
        }
      });
      if (response.status === 200) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error marking order as complete:', error);
      setMsg(`Couldn't mark as complete order: ${(orderId.slice(-5))}!`);
      setDoRedirect(false);
      setStatus(false);
      setShowPopup(true);
    }
  };

  const markAsReadyToPick = async (orderId) => {
    try {
      const adminToken = JSON.parse(localStorage.getItem('adminToken'));
      console.log(adminToken);
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/orders/${orderId}/readytopick`,
        {}, 
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );
      if (response.status === 200) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error marking order as ready to pick:', error);
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId((prevId) => (prevId === orderId ? null : orderId));
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.trim());
  };

  // const handleProductSearchChange = (e) => {
  //   setProductSearchTerm(e.target.value.trim());
  // };

  const handleAddProduct = (productId) => {
    setProductQuantities((prevQuantities) => {
      const newQuantity = (prevQuantities[productId] || 0) + 1;
      totalManualProducts.current += 1;
      return {
        ...prevQuantities,
        [productId]: newQuantity,
      };
    });
  };

  const handleIncrement = (productId) => {
    setProductQuantities((prevQuantities) => {
      const newQuantity = prevQuantities[productId] + 1;
      totalManualProducts.current += 1;
      return {
        ...prevQuantities,
        [productId]: newQuantity,
      };
    });
  };

  const handleDecrement = (productId) => {
    setProductQuantities((prevQuantities) => {
      const newQuantity = Math.max(prevQuantities[productId] - 1, 0);
      totalManualProducts.current -= prevQuantities[productId] > 0 ? 1 : 0;
      return {
        ...prevQuantities,
        [productId]: newQuantity,
      };
    });
  };

  const calculateTotalPrice = () => {
    return products.reduce((total, product) => {
      const quantity = productQuantities[product._id] || 0;
      return total + (quantity * product.sellingprice);
    }, 0);
  };

  const renderOrders = (orders) => {
    return orders
      .filter(order => order._id.slice(-5).includes(searchTerm))
      .map(order => (
        <div key={order._id} className="order">
          <div className='order-details'>
           <div className="orders-visible">
           <h3>Username: {order.username} {'\u00A0\u00A0\u00A0\u00A0'} Date: {new Date(order.order_date).toLocaleString()}</h3>
            <h3>Order Id: {(order._id).slice(-5)}</h3>
            <div className="order-btns">
              <button className='btn-1 expansion-btn' onClick={() => toggleOrderDetails(order._id)}>
            {expandedOrderId === order._id && expandedOrders[order._id] ? 'Less' : 'More...'}
          </button></div>
           </div>
            {expandedOrderId === order._id && expandedOrders[order._id] && (
              <div>
                <ul className='order-items'>
                  <div className='order-items-desc'>
                    <div className='order-item-product'>Products</div>
                    
                    <div className='order-item-quantity'>Quantity</div>
                    
                  </div>
                  {order.order_items.map(ord => (
                    <div key={ord._id} className='order-item'>
                      <div className="order-item-product">
                      <p className='order-item-name'>{ord.name}</p>
              <p className='order-item-type'>{ord.type_}</p>
              <p className='order-item-subtype'>{Object.values(ord.subtypes).join(', ')}</p>
              <p className='order-item-price'>per piece Rs.{ord.price}</p>
                      </div>
                      <div className='order-item-quantity'> {ord.quantity}</div>
                    </div>
                  ))}
                </ul>
                <p><b><i>Total Amount :</i></b> {'\u00A0\u00A0\u00A0'}  Rs. {order.bill_amt}</p>
                {statusFilter === 'readytopick' ? (
                  <>
                    <input type="text" placeholder='Enter the Code given from the customer!' onChange={handleCodeChange} />
                    {code === '' || code === null ? (
                      <button style={{ backgroundColor: 'lightblue', cursor: 'auto' }} className='btn-2'>Mark as Complete</button>
                    ) : (
                      <button className='btn-2' onClick={() => markAsComplete(order._id)}>Mark as Complete</button>
                    )}
                  </>
                ) : statusFilter === 'pending' ? (
                  <button className='btn-2' onClick={() => markAsReadyToPick(order._id)}>Mark as Ready to pick</button>
                ) : null}
              </div>
            )}
          </div>
          
        </div>
      ));
  };

  const renderProductSelectionScreen = () => {
    // const filteredProducts = products.filter(product => 
    //   product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
    // );

    return (
      <>
        <Form.Group controlId="formProductSearch" className="manualOrder-product-search-div">
          <Form.Control
            type="text"
            value={productIntermediateSearchTerm}
            onChange={(e)=>setProductIntermediateSearchTerm(e.target.value)}
            placeholder="Search by product name"
          />
          <Button onClick={handleSearch} id="search-product-btn" className="search-product-btn">
          <SearchIcon />
        </Button>
        </Form.Group>
        <Form.Group controlId="formAddNewOrderProducts">
          {/* <Form.Label>Products</Form.Label> */}
          <div className="product-grid-manual">
            {products.map(product => (
              <div key={product._id} className="product-card-manual">
                <div className='product-image-manual'>
                  <DisplayProductImage productName={product.name} productId={product._id} img={product.img} />
                </div>
                <div className='product-details-manual'>
                  <p>Name: {product.name}</p>
                  <p>Price: Rs. {product.sellingprice}</p>
                  <p>{product.type}</p>
                  <p>{Object.values(product.subtypes).join(', ')}</p>
                 
                  {productQuantities[product._id] > 0 ? (
                      <>
                         <Button variant="secondary"  className='btn-1' onClick={(e) => { e.stopPropagation(); handleIncrement(product._id); }}>+</Button> {productQuantities[product._id]} <Button variant="secondary" className='btn-1' onClick={(e) => { e.stopPropagation(); handleDecrement(product._id); }}>-</Button>
                      </>
                    ) : (
                      
                      <Button
                      className='btn-1'
                      onClick={() => handleAddProduct(product._id)}
                    >
                      Add
                    </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </Form.Group>
        {
          totalManualProducts.current > 0 && (
            <Form.Group className='manual-order-proceed-btn-container' style={{ bottom: `${window.innerHeight / 4.5}px` }}>

              <Button className='btn-1 manual-order-proceed-btn' onClick={() => setModalScreen('orderSummary')}>Proceed</Button>
            </Form.Group>
            )
        }
       
      </>
    );
  };

  const renderOrderSummaryScreen = () => {
    return (
      <>
        <div className="order-summary">
          <div className="product-quantities">
            {products.map(product => (
              productQuantities[product._id] > 0 && (
                <div key={product._id} className="product-manual-item">
                  <div>
                  <div className='product-info'>
                  <div className='product-name'>{product.name}</div>
                  <div>{product.type}</div>
                  <div>{Object.values(product.subtypes).join(', ')}</div>
                  <div>per pc. Rs {product.sellingprice}</div>
                    </div>
                  <div><Button variant="secondary" className='btn-1 quantitize-btn' onClick={() => handleIncrement(product._id)}>+</Button>
                  <p> {productQuantities[product._id]} </p>
                  <Button variant="secondary"  className='btn-1 quantitize-btn' onClick={() => handleDecrement(product._id)}>-</Button>
                  </div>
                  </div>
                  
                  
                  
                </div>
              )
            ))}
          </div>
          <div className="total-price">
            <p>Total Price: Rs. {calculateTotalPrice()}</p>
          </div>
          <Button className='btn-1' style={{marginRight:".3rem"}} onClick={() => setModalScreen('productSelection')}>Back</Button>
          <Button className='btn-1' onClick={addNewManualOrder}>Add New Order</Button>
        </div>
      </>
    );
  };

  return (
    <div className='children'>
    <div className="orders-container">
    {showPopup && (
        <Popup
          message={msg}
          onClose={handleClosePopup}
          status={status}
          doRedirect={doRedirect}
        />
      )}
      <Modal show={showModal} onHide={() => { setShowModal(false); setModalScreen('productSelection'); }}>
        <Modal.Header closeButton>
          <Modal.Title>Manual Orders</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }} onScroll={handleScroll}>
          <Form >
            {modalScreen === 'productSelection' ? renderProductSelectionScreen() : renderOrderSummaryScreen()}
          </Form>
        </Modal.Body>
      </Modal>
      <button className='btn-1' onClick={() => { setShowModal(true) }}>Add Manual Order</button>
      <div className='order-search-div'>
        <input
          type='text'
          placeholder='Search by last 5 characters of Order ID'
          value={searchTerm}
          onChange={handleSearchChange}
          className='search-input'
        />
      </div>
      <section className='order-lists'>
      
          <div className="order-status-btns">
         
         <div className='status-btn'>
            <button className={statusFilter === 'pending' ? 'btn-1' : 'btn-2'} onClick={() => setStatusFilter('pending')}>Pending </button>
          </div>
          <div className='status-btn'>
            <button className={statusFilter === 'readytopick' ? 'btn-1' : 'btn-2'} onClick={() => setStatusFilter('readytopick')}>Ready</button>
          </div>
          <div className='status-btn'>
            <button className={statusFilter === 'complete' ? 'btn-1' : 'btn-2'} onClick={() => setStatusFilter('complete')}>Previous</button>
          </div>
          
         </div>
         
          <div className='orders'>
        {renderOrders(ordersByUser.filter(order => order.status === statusFilter))}
        </div>
      </section>
    </div>
    </div>
  );
}

export default OrderPage;
