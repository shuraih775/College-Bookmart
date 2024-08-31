import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Popup from './popup';
import { PDFDocument } from 'pdf-lib';
import { Modal, Button } from 'react-bootstrap';
import '../styles/printout.css';

const PrintoutPage = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [btnClicked, setBtnClicked] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(false);
  const [doRedirect, setDoRedirect] = useState(false);
  const [selectedColor, setSelectedColor] = useState('black and white');
  const [isReport, setIsReport] = useState(false);
  const [department, setDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [pendingPrintouts, setPendingPrintouts] = useState([]);
  const [readyToPickPrintouts, setReadyToPickPrintouts] = useState([]);
  const [printMode, setPrintMode] = useState('duplex');
  const [numCopies, setNumCopies] = useState(1);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [price, setPrice] = useState(0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const fetchPrintouts = useCallback(async () => {
    try {
      const token = JSON.parse(sessionStorage.getItem('token'));
      if (token) {
        const response = await axios.get(`http://localhost:5000/api/upload/user/${statusFilter}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const uploads = response.data.uploads;
        setPendingPrintouts(uploads.filter(printout => printout.status === 'pending'));
        setReadyToPickPrintouts(uploads.filter(printout => printout.status === 'readytopick'));
      } 
    } catch (error) {
      console.error('Error fetching printouts:', error);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPrintouts();
  }, [statusFilter, fetchPrintouts]);

  const DepartmentDropdown = () => {
    const handleDepartmentChange = (e) => {
      setDepartment(e.target.value);
    };

    return (
      <div className='dept-div'>
        <label htmlFor="department">Department:</label>
        <select id="department" value={department} onChange={handleDepartmentChange}>
          <option value="">Select Department</option>
          <option value="cse">Computer Science and Engineering (CSE)</option>
          <option value="eee">Electrical and Electronics Engineering (EEE)</option>
          <option value="ece">Electronics and Communication Engineering (ECE)</option>
          <option value="aiml">Artificial Intelligence and Machine Learning (AIML)</option>
          <option value="aids">Artificial Intelligence and Data Science (AIDS)</option>
          <option value="mech">Mechanical Engineering</option>
          <option value="civil">Civil Engineering</option>
          <option value="iot">Internet of Things (IoT)</option>
          <option value="iem">Industrial Engineering and Management (IEM)</option>
        </select>
      </div>
    );
  };

  const handleClosePopup = (doRedirect) => {
    setShowPopup(false);
    if (doRedirect) {
      navigate('/login');
    }
  };

  const handleColorChange = (event) => {
    setSelectedColor(event.target.value);
  };
  const handlePrintModeChange = (event) => {
    setPrintMode(event.target.value);
  };
  const handleNumCopiesChange = (event) => {
    setNumCopies(event.target.value);
  };
  const handleExtraInstructionsChange = (event) => {
    setExtraInstructions(event.target.value);
  };

  const getPageCount = async (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    let pageCount = 0;

    if (fileExtension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      pageCount = pdfDoc.getPageCount();
    }  else if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png') {
      pageCount = 1;
    } else {
      console.warn('Unsupported file type:', fileExtension);
    }

    return pageCount;
  
  };

  const calculatePrice = (numCopies, colorType, printMode, pageCount, isReport) => {
    if (isReport) {
      return (20 + pageCount * 2) * numCopies;
    }
    const colorPrice = colorType === 'color' ? 8 : 0;
    const duplexPrice = printMode === 'duplex' ? 0.5 : 1;
    const basePrice = 1;
    return (basePrice + colorPrice + duplexPrice) * numCopies * pageCount;
  };

  const handleProceed = async (e) => {
    e.preventDefault();
    const files = fileInputRef.current.files;
    if (files.length === 0) {
      setMsg('Select at least one file to proceed!');
      setStatus(false);
      setDoRedirect(false);
      setShowPopup(true);
      return;
    }

    let totalPageCount = 0;
    try{
      for (let i = 0; i < files.length; i++) {
        totalPageCount += await getPageCount(files[i]);
      }
      setPageCount(totalPageCount);
    }
    catch{
      setMsg('Something is wrong with the uploaded files');
      setStatus(false);
      setDoRedirect(false);
      setShowPopup(true);
      // setBtnClicked(false);
      return;
    }
    
    const totalPrice = calculatePrice(numCopies, selectedColor, printMode, totalPageCount, isReport);
    setPrice(totalPrice);
    setShowSummaryModal(true);
  };

  const handleUpload = async () => {
    setBtnClicked(true);
    const files = fileInputRef.current.files;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    formData.append('pageCount', pageCount);
    formData.append('price', price);
    formData.append('Color', selectedColor);
    formData.append('printMode', printMode);
    formData.append('numCopies', numCopies);
    formData.append('extraInstructions', extraInstructions);
    formData.append('isReport', isReport.toString());
    formData.append('dept', isReport ? department : '');

    let token = null;
    try {
      token = JSON.parse(sessionStorage.getItem('token'));
      if (!token) {
        throw new Error('Invalid token');
      }
    } catch {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/upload/', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201) {
        setMsg('Upload successful!');
        setStatus(true);
        setDoRedirect(false);
        setShowPopup(true);
        setBtnClicked(false);
        setShowSummaryModal(false);
      } else if (response.status === 401) {
        setMsg("Please login to order. Navigating to Login Page...");
        setStatus(false);
        setDoRedirect(true);
        setShowPopup(true);
        setBtnClicked(false);
      } else {
        setMsg('Upload failed. Please try again.');
        setStatus(false);
        setDoRedirect(false);
        setShowPopup(true);
        setBtnClicked(false);
      }
    } catch {
      setMsg('Upload failed. Please try again.');
      setStatus(false);
      setDoRedirect(false);
      setShowPopup(true);
      setBtnClicked(false);
    }
  };

  const renderPrintouts = (printouts) => {
    return (
      <ul>
        {printouts.map(printout => (
          <div key={printout._id} className='print-details'>

            <div><p>Uploaded Date: </p><p>{new Date(printout.uploadDate).toLocaleString()}</p></div>
            {
              printout.isReport === 'Yes'?
              (<>
               <div><p>Is Report:</p> <p>{printout.isReport === 'Yes'? 'Yes' : 'No'}</p></div>
               <div><p>Department:</p> <p>{printout.dept}</p></div></>):
              (<>
               <div> <p>Price:</p> <p>{printout.price}</p></div>
                <div> <p>Color: </p> <p>{printout.Color}</p></div>
                <div><p>Page Count: </p><p>{printout.pageCount}</p></div>
                <div><p>Print Mode:</p> <p>{printout.printMode}</p></div>
                <div><p>Extra Instructions:</p> <p>{printout.extraInstructions}</p></div>
              </>)
            }
           
           
          </div>
        ))}
      </ul>
    );
  };
  
  return (
    <>
      <section className='content children'>
        <form id="uploadForm" onSubmit={handleProceed}>
          <label htmlFor="pdfFiles">Select PDF/JPG/PNG Files To Upload (Files should not exceed 15MB):</label>
          <input type="file" id="files" name="files" accept=".pdf,.jpg,.png" multiple ref={fileInputRef} />

          
          <div className='print-main-div'>
           <div className='print-div'>
             <div id='print-label'><label>Report:</label></div>
             <div>
              <div>
              <label>
                <input
                  type="radio"
                  value="Yes"
                  checked={isReport}
                  onChange={() => setIsReport(true)}
                />
                Yes
              </label>
              </div>
             <div>
             <label>
               <input
                 type="radio"
                 value="No"
                 checked={!isReport}
                 onChange={() => {
                   setIsReport(false);
                 }}
               />
               No
             </label>
             </div></div>
           </div>
           {!isReport && (
             <>
               <div className='print-div'>
                 <div id='print-label'> <label>Print Type:</label></div>
                 <div>
                 <div>
                 <label className='radio-label'>
                   <input
                     type="radio"
                     value="black and white"
                     checked={selectedColor === 'black and white'}
                     onChange={handleColorChange}
                   />
                   B & W
                 </label>
                 </div>
                 <div>
                 <label>
                   <input
                     type="radio"
                     value="color"
                     checked={selectedColor === 'color'}
                     onChange={handleColorChange}
                   />
                   Colored
                 </label>
                 </div>
                 </div>
               </div>

               <div className='print-div'>
                <div id='print-label'> <label htmlFor="printMode" >Print Mode:</label></div>
                 
                 <select id="printMode" value={printMode} onChange={handlePrintModeChange}>
                   <option value="duplex">Double Sided</option>
                   <option value="simplex">Single Sided</option>
                 </select>
               </div>

               <div className='print-div num-copies'>
                 
                 <div id='print-label'> <label htmlFor="numCopies" >Number of Copies:</label></div>
                 <input
                   type="number"
                   id="numCopies"
                   value={numCopies}
                   onChange={handleNumCopiesChange}
                   min="1"
                   className="num-copies-input"
                 />
               </div>

               <div className='print-div extra-instruct'>
                 <div id='print-label'> <label htmlFor="extraInstructions" >Extra Instructions:</label></div>
                 <textarea
                   id="extraInstructions"
                   value={extraInstructions}
                   onChange={handleExtraInstructionsChange}
                   className="extra-instructions-input"
                 />
               </div>
             </>
           )}
           {isReport && <DepartmentDropdown />}

           
         </div>
         <button className='btn-1' type="submit">Proceed</button>
          
          
        
           
        </form>

        <Modal show={showSummaryModal} onHide={() => setShowSummaryModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Print Summary</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Number of Pages: {pageCount}</p>
            <p>Price: Rs. {price.toFixed(2)}</p>
          </Modal.Body>
          <Modal.Footer>
            {!btnClicked?
            (<><Button className='btn-1 modal-btn' onClick={handleUpload}>Upload and Proceed to Pay</Button>
            <Button className='btn-3 cancel-btn modal-btn' onClick={() => setShowSummaryModal(false)}>Cancel</Button></>)
            :
            (<>
            <button className='btn-1' style={{backgroundColor:'#e0e084'}} type="button">
            <div className="loader-cart"></div>
          </button>
          <Button className='btn-3 cancel-btn-light modal-btn'>Cancel</Button>
            </>)}
            
          </Modal.Footer>
        </Modal>

        {showPopup && (
          <Popup
            message={msg}
            status={status}
            doRedirect={doRedirect}
            onClose={handleClosePopup}
          />
        )}
      </section>

      <section className="content" style={{ marginTop: 0 }}>
        <div className='print-detail-div'>
          <button className={`btn-filter ${statusFilter === 'pending' ? 'btn-1' : 'btn-2'} btn-pending`} onClick={() => setStatusFilter('pending')}>Pending</button>
          <button className={`btn-filter ${statusFilter === 'readytopick' ? 'btn-1' : 'btn-2'} btn-ready`} onClick={() => setStatusFilter('readytopick')}>Ready to Pick</button>
        </div>
        {renderPrintouts(statusFilter === 'pending' ? pendingPrintouts : readyToPickPrintouts)}
      </section>
    </>
  );
};

export default PrintoutPage;
