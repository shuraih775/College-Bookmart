import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Button,Form } from 'react-bootstrap';
import Loading from './Loading';
import SearchIcon from '../searchIcon';
import PlusIcon from '../plusIcon';
import MinusIcon from '../minusIcon';
import RightArrow from '../rightArrow';
import Popup from './popup';
import '../styles/stationery.css';

function StationeryPage() {
  // const [products, setProducts] = useState([]);
  const debounceTimeout = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [status, setStatus] = useState(false);
  const [msg, setMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [searchIntermediateTerm, setIntermediateSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSubTypes, setSelectedSubTypes] = useState({});
  const [subTypesToRender, setSubTypesToRender] = useState([]);
  const [filteredProducts,setFilteredProducts] =  useState([]);
  // const filteredProducts = useRef([]);
  const[showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState({
    type: 'all',
    subtypes: {}
  });
  const fetchedProductsPage = useRef(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  const navigate = useNavigate();

  const Subtypes = [
   
    {"InkType":["Ball","Gel"]},
    {"Color":["Red","Blue","Green","Black"]},
    {"Pencil Type":["Mechanical","Graphite"]},
    {"Grade":["2B","3B","HB"]},
    {"Lead Size":[".7mm",".9mm"]},
    {"Ruler Type":["Plastic","Steel"]},
    {"Ruler Length":["15cm","30cm"]}

  ];
  const types = ["Pen","Pencil","Ruler","Eraser","Sharpner","Whitener"];
  const typeDependencies = [
    {"Pen":["InkType","Color"]},
    {"Pencil":["Pencil Type"]},
    {"Pencil Type":["Mechanical","Graphite"]},
    {"Mechanical":["Grade"]},
    {"Graphite":["Lead Size"]},
    {"Ruler":["Ruler Type","Ruler Length"]},

  ];



  const fetchProducts = useCallback(async (filter,term, currPage, productsPerPage = parseInt(windowWidth / 180 * 4)) => {
    try {
      // console.log(productsPerPage);
      const Page = currPage || page;
      console.log(Page,currPage);
      if (fetchedProductsPage.current >= Page) {
        return;
      }
      fetchedProductsPage.current = Page;
      
      setLoading(true);
  
      const filters = filter || appliedFilters;
      const searchTerms = term || searchTerm;
      const queryParams = new URLSearchParams({
        page:Page,
        limit: productsPerPage,
        searchName: searchTerms,
        filters: JSON.stringify(filters),
      });
  
      console.log(page, appliedFilters);
      const response = await axios.get(`https://college-bookmart.onrender.com/api/product/available?${queryParams.toString()}`);
  
      const productsWithImageUrl = await Promise.all(
        response.data.products.map(async (product) => {
          const imgResponse = await axios.get(
            `https://college-bookmart.onrender.com/api/product/${product._id}/image`,
            { responseType: 'blob' }
          );
          const imageUrl = URL.createObjectURL(imgResponse.data);
          return { ...product, img: imageUrl };
        })
      );
      console.log(filters,term)
      
      setFilteredProducts(filteredProducts=>{return [...filteredProducts, ...productsWithImageUrl]});
      // filteredProducts.current = [...filteredProducts.current, ...productsWithImageUrl];
      
      // fetchedProductsPage.current = page;
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setMsg("Unable to fetch Products!");
      setStatus(false);
      setShowPopup(true);
      console.error('Error fetching products:', error);
    }
  }, [appliedFilters, page, searchTerm, windowWidth]);
  
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - windowHeight/10) {  // Adjusted threshold
        setPage((prevPage) => prevPage + 1);
        fetchProducts(undefined,undefined,page+1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchProducts, page,windowHeight]);
  
  

  

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

 

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(storedCart);
  }, []);

 
    

  useEffect(() => {
    // Clear the timeout if `fetchProducts` is called again within the debounce period
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a timeout to delay the fetchProducts call
    debounceTimeout.current = setTimeout(() => {
      fetchProducts();
    }, 300); // Adjust the debounce delay as needed

    // Cleanup function to clear the timeout on unmount
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [fetchProducts]);


  const handleApplyFilters = () => {
    setPage(1);
    fetchedProductsPage.current = 0;
    console.log(selectedType,selectedSubTypes)
    setAppliedFilters({ type: selectedType, subtypes: selectedSubTypes });
    setFilteredProducts([]);
    // filteredProducts.current = [];
    fetchProducts({ type: selectedType, subtypes: selectedSubTypes });
    setShowFilters(false);
    
  };
  

  const handleResetFilters = () => {
    setPage(1);
    fetchedProductsPage.current = 0;
    setFilteredProducts([]);
    // filteredProducts.current = [];
    setSelectedType('all');
    setSelectedSubTypes({});
    setSubTypesToRender([]);
    setSearchTerm('');
    setIntermediateSearchTerm('');
    setAppliedFilters({ type: 'all', subtypes: {} });
    setShowFilters(false);
    fetchProducts();
    
  };
  

  const handleSearch = () => {
    setFilteredProducts([]);
    // filteredProducts.current = [];
    setPage(1);
    fetchedProductsPage.current = 0;
    if (searchIntermediateTerm.trim() === '') {
      // Reset the search term and fetch all products
      setSearchTerm('');
      fetchProducts(undefined, '');
    } else {
      // Apply the search term and fetch products
      setSearchTerm(searchIntermediateTerm.trim());
      fetchProducts(appliedFilters, searchIntermediateTerm.trim());
    }
    
  };

  const handleAddToCart = (product) => {
    const { name, sellingprice, _id, type, subtypes } = product;

    const existingItemIndex = cart.findIndex((item) => item.name === name && item.type === type && item.subtypes === subtypes);

    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } else {
      const newCartItem = {
        name,
        quantity: 1,
        price: sellingprice,
        _id,
        type_: type,
        subtypes,
      };
      const updatedCart = [...cart, newCartItem];
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    }
  };

  const handleIncrementQuantity = (productId) => {
    const updatedCart = cart.map((item) =>
      item._id === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleDecrementQuantity = (productId) => {
    const updatedCart = cart
      .map((item) =>
        item._id === productId
          ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 0 }
          : item
      )
      .filter((item) => item.quantity > 0);

    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const DisplayProductImage = ({ productId,productName, img }) => {
    const [imageLoading, setimageLoading] = useState(!img);

    useEffect(() => {
      if (!img) {
        
        axios.get(`https://college-bookmart.onrender.com/api/product/${productId}/image`, {
            responseType: 'blob',
          })
          .then((response) => {
           
            setimageLoading(false);
          })
          .catch((error) => {
            setimageLoading(false);
          });
      } else {
        setimageLoading(false);
      }
    }, [productId, img]);

    return imageLoading ? (
      <div>
        <Loading />
      </div>
    ) : (
      <img
        src={img}
        alt={productName}
        className="product-card-img"
      />
    );
  };


  const updateSubTypesToRender = (type) => {
   
    
    if (type === 'all') {
      
      return;
    }
  
    const subTypes = [];
    let subTypesReturned = [];
    
    // let typeDependency = null;
    typeDependencies.forEach((obj) => {
      if (obj[type]) {
        
  
        obj[type].forEach((subType) => {
          const subtypeObj = Subtypes.find(sub => sub[subType]);
          if (subtypeObj) {
            
  
           
            subTypes.push(subType);
          }
          else if(typeDependencies.find(sub=>sub[subType])){
             subTypesReturned  =  updateSubTypesToRender(subType);
          }
        });
      }
    });
  
    
    return [...subTypes,...subTypesReturned];
  };

  
  const handleSubTypeChange = (subType, value) => {
    // console.log("selectedSubTypes",selectedSubTypes);
    setSelectedSubTypes(prevSubTypes => {
      
      const selectedToRemove = prevSubTypes[subType];
      // console.log("selectedToRemove",selectedToRemove);
  
      
      const subTypesToRemove = [];
      const findChildren = (currentSubType) => {
        typeDependencies.forEach(dep => {
          if (dep[currentSubType]) {
            // console.log("dep:",dep[currentSubType]);
            dep[currentSubType].forEach(child => {
              // console.log(child);
              subTypesToRemove.push(child);
              // findChildren(child); // Recursively find further children
            });
          }
        });
      };
      
      if (selectedToRemove) {
        
        findChildren(selectedToRemove);
      }
     
      
      
      const newSubTypes = { ...prevSubTypes };
      subTypesToRemove.forEach(type => {
        delete newSubTypes[type];
      });
       
      const newSubTypesToRender = subTypesToRender.filter(
        (subtype) => !subTypesToRemove.includes(subtype)
      );
      
      
      setSubTypesToRender([...newSubTypesToRender,...updateSubTypesToRender(value)]);
      
      if (value !== 'all') {
        newSubTypes[subType] = value;
      }
      
      return newSubTypes;
    });
  
    
    
  };
  
  
  const renderSubtypes = (subType) => {
    const subtypeOptions = Subtypes.find(sub => sub[subType]);
    const options = subtypeOptions ? subtypeOptions[subType] : [];
  
    return (
      <Form.Group controlId={subType}>
        <Form.Label>{subType}:</Form.Label>
        <Form.Select
          id={subType}
          onChange={(e) => {
            
            handleSubTypeChange(subType, e.target.value);
            
          }}
        >
          <option value="all">All</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Form.Select>
        </Form.Group>
    );
  };
  
  

 

  return (
    <div className='children'>
      <div className="search-and-filter-div">
        <div className="filter-div">
          <button
            id="filter-btn"
            onClick={() => setShowFilters(true)}
          >
            Filter
          </button>
        </div>
        <div className="search-div">
          <input
            type="text"
            placeholder="Search by name"
            value={searchIntermediateTerm}
            onChange={(e) => setIntermediateSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={handleSearch} id="search-btn" className="search-btn">
            <SearchIcon />
          </button>
        </div>
      </div>
      <Modal show={showFilters} onHide={() => setShowFilters(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Filter Products</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <label htmlFor="type-filter">Type:</label>
            <Form.Select
              id="type-filter"
              value={selectedType}
              onChange={
                (e) => {setSelectedType(e.target.value);
                  setSubTypesToRender([]);
                  setSelectedSubTypes({});
                  setSubTypesToRender(updateSubTypesToRender(e.target.value));
                  
                }

              }
            >
              <option value="all">All</option>
              {/* {console.log(types)} */}
              {types.map((type) => (
                <option key={type} value={type}>
                  {/* {console.log(subTypesToRender)} */}
                  {type}
                </option>
              ))}
            </Form.Select>
          </div>
          {selectedType !== 'all' &&
      subTypesToRender.map((subType) => renderSubtypes(subType))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleResetFilters}>
            Reset
          </Button>
          <Button variant="primary" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </Modal.Footer>
      </Modal>
     
        <div className="product-list">
          <div className="product-grid">
            {/* {products.map((product) => ( */}
            {filteredProducts.map((product) => (
              <div key={product._id} className="product-card">
                <DisplayProductImage
                  productId={product._id}
                  productName={product.name}
                  img={product.img} 
                />
                <div>
                  <p>{product.name}</p>
                  <b>
                    <p>Rs. {product.sellingprice}</p>
                  </b>
                  <p className="type-text">
                    {product.type}
                    </p>
                    <p className='subtype-text'>({Object.values(product.subtypes).join(', ')})</p>
                  
                </div>
                <div
                  style={{
                    height: '',
                    alignItems: 'center',
                    paddingBottom: '0%',
                  }}
                >
                  {cart.find((item) => item._id === product._id) ? (
                    <div className="quantity-controls">
                      <button
                        className="product-subtract-btn"
                        onClick={() => handleDecrementQuantity(product._id)}
                      >
                        <MinusIcon />
                      </button>
                      <span className="quantity-disp">
                        <p>{cart.find((item) => item._id === product._id)?.quantity}</p>
                      </span>
                      <button
                        className="product-add-btn"
                        onClick={() => handleIncrementQuantity(product._id)}
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  ) : (
                    <button
                      id="add_btn"
                      onClick={() => handleAddToCart(product)}
                      className="btn-1"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {loading?(<Loading/>):(<></>)}
      
      {cart.length > 0 && (
        <div className="cart-button-container">
          <button
            className="btn-1 cart-button"
            onClick={() => navigate('/cart')}
          >
            Go to Cart ({cart.reduce((total, item) => total + item.quantity, 0)})
            <RightArrow />
          </button>
        </div>
      )}
      {showPopup && (
        <Popup
          message={msg}
          onClose={()=>{setShowPopup(false)}}
          status={status}
          doRedirect={false}
        />
      )}
    </div>
  );
}

export default StationeryPage;
