import React, { useState, useEffect, useRef,useCallback } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap'; 
import '../styles/stationery.css';
import SearchIcon from '../searchIcon';
import Loading from './Loading';


const ProductGrid = () => {
  const debounceTimeout = useRef(null);
  const nameref = useRef(null);
  const imgref = useRef(null);
  const buyingpriceref = useRef(null);
  const sellingpriceref = useRef(null);
  const quantref = useRef(null);
  const addQtyRef = useRef(null);
  const addBuyingPrice = useRef(null);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddQuantityModal, setShowAddQuantityModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedSubTypes, setSelectedSubTypes] = useState({});
  const [subTypesToRender, setSubTypesToRender] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [page, setPage] = useState(1);
  const fetchedProductsPage = useRef(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchIntermediateTerm, setIntermediateSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    type: 'all',
    subtypes: {}
  });
  const[loading, setLoading] = useState(false);


  useEffect(() => {
    fetchProducts();
  }, []);

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
  }, []);
  

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

  const Subtypes = [
   
    {"InkType":["Ball","Gel"]},
    {"Color":["Red","Blue","Green","Black"]},
    {"PencilType":["Mechanical","Graphite"]},
    {"Grade":["2B","3B","HB"]},
    {"Lead Size":[".7mm",".9mm"]},
    {"Ruler Type":["Plastic","Steel"]},
    {"Ruler Length":["15cm","30cm"]}

  ];
  const types = ["Pen","Pencil","Ruler","Eraser","Sharpner","Whitener"];
  const typeDependencies = [
    {"Pen":["InkType","Color"]},
    {"Pencil":["PencilType"]},
    {"PencilType":["Mechanical","Graphite"]},
    {"Mechanical":["Lead Size"]},
    {"Graphite":["Grade"]},
    {"Ruler":["Ruler Type","Ruler Length"]},

  ];


  // const fetchProducts = async () => {
  //   try {
  //     const token = JSON.parse(localStorage.getItem('adminToken'));
  //     if (!token) {
  //       console.error('Authorization token not found');
  //       return;
  //     }
  //     const response = await axios.get('http://localhost:5000/api/product/', {
  //       headers: {
  //         Authorization: `Bearer ${token}`
  //       }
  //     });
  //     const productsWithImageUrl = await Promise.all(response.data.map(async product => {
  //       const imgResponse = await axios.get(`http://localhost:5000/api/product/${product._id}/image`, {
  //         responseType: 'blob',
  //         headers: {
  //           Authorization: `Bearer ${token}`
  //         }
  //       });
  //       const imageUrl = URL.createObjectURL(imgResponse.data);
  //       return { ...product, img: imageUrl };
  //     }));
  //     setProducts(productsWithImageUrl);
  //   } catch (error) {
  //     console.error('Error fetching products:', error);
  //   }
  // };
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
      const token = JSON.parse(localStorage.getItem('adminToken'));
          if (!token) {
            console.error('Authorization token not found');
            setLoading(false);
            return;
          }
      console.log(page, appliedFilters);
      const response = await axios.get(`http://localhost:5000/api/product?${queryParams.toString()}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
  
      const productsWithImageUrl = await Promise.all(
        response.data.products.map(async (product) => {
          const imgResponse = await axios.get(
            `http://localhost:5000/api/product/${product._id}/image`,
            { responseType: 'blob' }
          );
          const imageUrl = URL.createObjectURL(imgResponse.data);
          return { ...product, img: imageUrl };
        })
      );
      console.log(filters,term)
      
      setProducts(products=>{return [...products, ...productsWithImageUrl]});
      setLoading(false);
      // filteredProducts.current = [...filteredProducts.current, ...productsWithImageUrl];
      
      // fetchedProductsPage.current = page;
      
    } catch (error) {
      setLoading(false);
      console.error('Error fetching products:', error);
    }
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
    setProducts([]);
    // filteredProducts.current = [];
    fetchProducts({ type: selectedType, subtypes: selectedSubTypes });
    setShowFilters(false);
    
  };
  

  const handleResetFilters = () => {
    setPage(1);
    fetchedProductsPage.current = 0;
    setProducts([]);
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
    setProducts([]);
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


  const updateSubTypesToRender = (type) => {
    // console.log("Selected Type:", type);
    
    if (type === 'all') {
      // setSubTypesToRender([]);
      // console.log("No subtypes for 'all'");
      return;
    }
  
    const subTypes = [];
    let subTypesReturned = [];
    
    // let typeDependency = null;
    typeDependencies.forEach((obj) => {
      if (obj[type]) {
        // console.log("Found type in typeDependencies:", type, obj[type]);
  
        obj[type].forEach((subType) => {
          const subtypeObj = Subtypes.find(sub => sub[subType]);
          if (subtypeObj) {
            // console.log("Found subType in Subtypes:", subType, subtypeObj[subType]);
  
           
            subTypes.push(subType);
          }
          else if(typeDependencies.find(sub=>sub[subType])){
             subTypesReturned  =  updateSubTypesToRender(subType);
          }
        });
      }
    });
  
    // console.log("Final subTypesToRender:", subTypes);
    console.log("subTypesToRender1",subTypesToRender);
    // setSubTypesToRender(prevItems => [...prevItems,...subTypes]);
    return [...subTypes,...subTypesReturned];
  };

  
  const handleSubTypeChange = (subType, value) => {
    console.log("selectedSubTypes",selectedSubTypes);
    setSelectedSubTypes(prevSubTypes => {
      
      const selectedToRemove = prevSubTypes[subType];
      console.log("selectedToRemove",selectedToRemove);
  
      
      const subTypesToRemove = [];
      const findChildren = (currentSubType) => {
        typeDependencies.forEach(dep => {
          if (dep[currentSubType]) {
            console.log("dep:",dep[currentSubType]);
            dep[currentSubType].forEach(child => {
              console.log(child);
              subTypesToRemove.push(child);
              // findChildren(child); // Recursively find further children
            });
          }
        });
      };
      
      if (selectedToRemove) {
        
        findChildren(selectedToRemove);
      }
      console.log("subTypesToRemove",subTypesToRemove);
      
      
      const newSubTypes = { ...prevSubTypes };
      subTypesToRemove.forEach(type => {
        delete newSubTypes[type];
      });
      console.log("subTypesToRender",subTypesToRender);
      const newSubTypesToRender = subTypesToRender.filter(
        (subtype) => !subTypesToRemove.includes(subtype)
      );
      
      console.log("newSubTypesToRender",newSubTypesToRender);
      // console.log(subTypesToRender);
      setSubTypesToRender([...newSubTypesToRender,...updateSubTypesToRender(value)]);
      
      if (value !== 'all') {
        newSubTypes[subType] = value;
      }
      console.log(newSubTypes);
      return newSubTypes;
    });
  
    
    // updateSubTypesToRender(value);
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
  
  const addProduct = async () => {
    try {
      
      const name = nameref.current.value.trim();
      const type = selectedType;
      const subtypes = selectedSubTypes;
      const buyingprice = buyingpriceref.current.value.trim();
      const sellingprice = sellingpriceref.current.value.trim();
      const quantity = quantref.current.value.trim();

      if (!name || !sellingprice || !quantity || !type ) {
        console.error('Name, selling price, and quantity are required.');
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      if (imgref.current.files[0]) {
        formData.append('img', imgref.current.files[0]);
      }
      formData.append('quantity', quantity);
      formData.append('sellingprice', sellingprice);
      formData.append('buyingprice', buyingprice);
      formData.append('type', type);
      formData.append('subtypes', JSON.stringify(subtypes));
      
      const token = JSON.parse(localStorage.getItem('adminToken'));
      if (!token) {
        console.error('Authorization token not found');
        return;
      }
      await axios.post('http://localhost:5000/api/product/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      fetchProducts();
      setShowAddProductModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const addQuantity = async (id) => {
    try {
      const additionalQuantity = addQtyRef.current.value.trim();
      const buyingprice = addBuyingPrice.current.value.trim();
      if (!additionalQuantity || !buyingprice) {
        console.error('Additional quantity and buying price are required.');
        return;
      }

      const updatedProduct = {
        quantity: additionalQuantity,
        buyingprice
      };

      const token = JSON.parse(localStorage.getItem('adminToken'));
      if (!token) {
        console.error('Authorization token not found');
        return;
      }
      await axios.patch(`http://localhost:5000/api/product/${editingProduct._id}/quantity`, updatedProduct, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      fetchProducts();
      setShowAddQuantityModal(false);
    } catch (error) {
      console.error('Error adding quantity:', error);
    }
  };

  const saveEdit = async (id) => {
    try {
      const updatedProduct = {
        _id : id,
        name: nameref.current.value.trim(),
        type: selectedType,
        subtypes: JSON.stringify(selectedSubTypes),
        sellingprice: sellingpriceref.current.value.trim(),
        // quantity: quantref.current.value.trim(),
        // img: editingProduct.img
      };

      const token = JSON.parse(localStorage.getItem('adminToken'));
      if (!token) {
        console.error('Authorization token not found');
        return;
      }
      await axios.put(`http://localhost:5000/api/product/${editingProduct._id}`, updatedProduct, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      fetchProducts();
      setShowEditModal(false);
      resetForm();
      
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const resetForm = () => {
    nameref.current.value = '';
    setSelectedType('all');
    setSelectedSubTypes([]);
    imgref.current.value = null;
    quantref.current.value = '';
    sellingpriceref.current.value = '';
    buyingpriceref.current.value = '';
  };

  return (
    <div className='children'>
      <h1>Product Grid</h1>
      <div className="add-product-btn">
        
      <Button className="btn-1" onClick={() => setShowAddProductModal(true)}>Add New Product</Button>
      </div>
      <div className="search-and-filter-div">
        <div className="filter-div">
          <button
            id="filter-btn"
            onClick={() => setShowFilters(true)}
          >
            Filter
          </button>
        </div>
        <div className="search-product-div">
          <input
            type="text"
            placeholder="Search by name"
            value={searchIntermediateTerm}
            onChange={(e) => setIntermediateSearchTerm(e.target.value)}
            className="search-product-input"
          />
          <button onClick={handleSearch} id="search-product-btn" className="search-product-btn">
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
      <div className="product-grid">
        {products.map(product => (
          <div key={product._id} className="product-card">
            <img src={product.img} alt={product.name} className='product-img' />
            <p>Name: {product.name}</p>
            <p>Type: {product.type}</p>
            <p>Subtype: {Object.values(product.subtypes).join(', ')}</p>
            <p>Quantity: {product.quantity}</p>
            <p>Price: {product.sellingprice}</p>
            <div className='product-btn-container'>
            <Button className='btn-1 edit-btn' onClick={() => handleEdit(product)}>Edit</Button>
            <Button className='btn-1 add-quantity-btn' onClick={() => { setEditingProduct(product); setShowAddQuantityModal(true);setSelectedType(editingProduct?.type);
            setSelectedSubTypes(editingProduct?.subtypes); }}>Add Quantity</Button>
            </div>
            
          </div>
        ))}
      </div>
      {
        loading?(<Loading/>):(<></>)
      }
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formProductName">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" defaultValue={editingProduct?.name} ref={nameref} />
            </Form.Group>
            {/* <Form.Group controlId="formProductType">
              <Form.Label>Type</Form.Label>
              <Form.Control type="text" defaultValue={editingProduct?.type} ref={typeref} />
            </Form.Group>
            <Form.Group controlId="formProductSubType">
              <Form.Label>SubType</Form.Label>
              <Form.Control type="text" defaultValue={editingProduct?.subtype} ref={subtyperef} />
            </Form.Group> */}
            
            <Form.Group controlId="formProductType">
              <Form.Label>Type</Form.Label>
              <Form.Select value={selectedType} onChange={
                (e) => {setSelectedType(e.target.value);
                  setSubTypesToRender([]);
                  setSelectedSubTypes({});
                  setSubTypesToRender(updateSubTypesToRender(e.target.value));
                  
                }

              }>
                <option value="all">All</option>
                {types.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
                </Form.Select>
                
              
            </Form.Group>
            {selectedType !== 'all' &&
      subTypesToRender.map((subType) => renderSubtypes(subType))}
            <Form.Group controlId="formProductPrice">
              <Form.Label>Price</Form.Label>
              <Form.Control type="text" defaultValue={editingProduct?.sellingprice} ref={sellingpriceref} />
            </Form.Group>
            <Button className='btn-1' style={{marginBottom:'.2rem'}} onClick={()=>{saveEdit(editingProduct?._id)}}>Save</Button>
            <Button className='btn-1 cancel-btn' onClick={() => setShowEditModal(false)}>Cancel</Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showAddQuantityModal} onHide={() => setShowAddQuantityModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Quantity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formAddQuantity">
              <Form.Label>Additional Quantity</Form.Label>
              <Form.Control type="text" placeholder="Enter quantity to add" ref={addQtyRef} />
            </Form.Group>
            <Form.Group controlId="formAddQuantityBuyingPrice">
              <Form.Label>Buying Price</Form.Label>
              <Form.Control type="text" placeholder="Enter the buying price " ref={addBuyingPrice} />
            </Form.Group>
            <Button className='btn-1' onClick={addQuantity}>Add Quantity</Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showAddProductModal} onHide={() => setShowAddProductModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formProductName">
              <Form.Label>Image</Form.Label>
              <Form.Control type="file" accept="image/*" ref={imgref} />
            </Form.Group>
            <Form.Group controlId="formProductName">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" placeholder="Enter product name" ref={nameref} />
            </Form.Group>
            {/* <Form.Group controlId="formProductType"> */}
              {/* <Form.Label>Type</Form.Label>
              <Form.Control type="text" placeholder="Enter product type" ref={typeref} />
            </Form.Group>
            <Form.Group controlId="formProductSubType">
              <Form.Label>SubType</Form.Label>
              <Form.Control type="text" placeholder="Enter product subtype" ref={subtyperef} />
            </Form.Group> */}
            <Form.Group controlId="formProductType">
              <Form.Label>Type</Form.Label>
              <Form.Select value={selectedType} onChange={
                (e) => {setSelectedType(e.target.value);
                  setSubTypesToRender([]);
                  setSelectedSubTypes({});
                  setSubTypesToRender(updateSubTypesToRender(e.target.value));
                  
                }

              }>
                <option value="all">All</option>
                {types.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
                </Form.Select>
                
              
            </Form.Group>
            {selectedType !== 'all' &&
      subTypesToRender.map((subType) => renderSubtypes(subType))}
            <Form.Group controlId="formProductQuantity">
              <Form.Label>Quantity</Form.Label>
              <Form.Control type="text" placeholder="Enter product quantity" ref={quantref} />
            </Form.Group>
            <Form.Group controlId="formProductBuyingPrice">
              <Form.Label>Buying Price</Form.Label>
              <Form.Control type="text" placeholder="Enter buying price" ref={buyingpriceref} />
            </Form.Group>
            <Form.Group controlId="formProductSellingPrice">
              <Form.Label>Selling Price</Form.Label>
              <Form.Control type="text" placeholder="Enter selling price" ref={sellingpriceref} />
            </Form.Group>
            <Button className='btn-1'style={{marginBottom:'.2rem'}} onClick={addProduct}>Add New Product</Button>
            <Button className='btn-1 cancel-btn' onClick={() => setShowAddProductModal(false)}>Cancel</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProductGrid;
