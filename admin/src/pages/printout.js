import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Button, Form, Modal } from 'react-bootstrap';
// import Loading from './Loading';
import Popup from './popup';
import '../styles/orders.css';
import '../styles/printout.css';
import qz from 'qz-tray';
// import { PDFDocument } from 'pdf-lib';

function PrintoutPage() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [code, setCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(false);
  const [doRedirect, setDoRedirect] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [pages, setPages] = useState(0);
  const [isReport, setIsReport] = useState(false);
  const [Color, setColor] = useState('');
  const [department, setDepartment] = useState(null);
  const [numCopies, setNumCopies] = useState(0);
  const [showModal, setShowModal] = useState(false);
 
  const handleClosePopup = (doredirect) => {
    setShowPopup(false);
    if (doredirect) {
      // Handle redirection if necessary
    }
  };



  const fetchPdfFiles = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/upload/`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
        }
      });
      const documents = response.data.documents;
      const allFiles = documents.map(document => ({
        id: document._id,
        username: document.username,
        uploadDate: document.uploadDate,
        Color: document.Color,
        printMode: document.printMode,
        numCopies: document.numCopies,
        extraInstructions: document.extraInstructions,
        isReport: document.isReport,
        dept: document.department,
        status: document.status,
        files: document.files.map(file => ({
          id: file._id,
          name: file.name
        }))
      }));
      setPdfFiles(allFiles);
    } catch (error) {
      console.error('Error fetching PDF files:', error);
    }
  }, []);

  useEffect(() => {
    fetchPdfFiles();
  }, [fetchPdfFiles]);

  const handleManualPrintout = async ()=>{
    try{
      // console.log(Color,department,printMode);
      let printout = {}
      printout["pages"] = pages;
      printout["printMode"] = printMode;
      printout["isReport"] = isReport;
      printout["Color"] = Color;
      printout["department"] = department;
      printout["numCopies"] = numCopies;
      printout = JSON.stringify(printout)
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/upload/manualPrintout`,{printout}, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
        }
      });
      setShowModal(false);
      setMsg(`Order Successfully recorded`);
      setDoRedirect(false);
      setStatus(true);
      setShowPopup(true);
    }catch{
      setMsg(`Couldn't record the order`);
      setDoRedirect(false);
      setStatus(false);
      setShowPopup(true);
    }
  }
  // const handleColorChange = (e) => setColor(e.target.value);
  // const handlePrintModeChange = (e) => setPrintMode(e.target.value);
  // const handleNumCopiesChange = (e) => setNumCopies(e.target.value);
  // const removeFileBunch = async (parentToRemove) => {
  //   try {
  //     const updatedFiles = pdfFiles.filter(parent => parent.id !== parentToRemove.id);
  //     setPdfFiles(updatedFiles);
  //     const response = await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/upload/${parentToRemove.id}`, {
  //       headers: {
  //         Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
  //       }
  //     });
  //     if (response.status === 404) {
  //       console.log("encountered error");
  //     }
  //     window.location.reload();
  //   } catch (err) {
  //     console.error('Error removing file:', err);
  //   }
  // };
//   async function extractPage(blob) {
//     const existingPdfBytes = blob

//     // Load a PDFDocument from the existing PDF bytes
//     const pdfDoc = await PDFDocument.load(existingPdfBytes);

//     // Create a new PDFDocument
//     const newPdfDoc = await PDFDocument.create();

//     // Copy the first 5 pages
//     const pages = await newPdfDoc.copyPages(pdfDoc, [0]);
//     pages.forEach((page) => {
//         newPdfDoc.addPage(page);
//     });

//     // Serialize the new PDFDocument to bytes
//     const pdfBytes = await newPdfDoc.save();

//     // Return the new PDF as a Blob URL or save it to the file system
//     return new Blob([pdfBytes], { type: 'application/pdf' });
// }


  const printFile = async (copies, printMode, Color, isReport, fileBlob) => {
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect()
      }
      // await qz.websocket.disconnect();
      // await qz.websocket.connect(); // Connect to QZ Tray
      qz.printers.find().then(printers => {
        console.log("Available printers:", printers);
    }).catch(err => {
        console.error("Error finding printers:", err);
    });
      
      const config = qz.configs.create('Microsoft Print to PDF', {
        copies: copies, 
        duplex: printMode === "duplex"?true :false ,  // Enable duplex (back-to-back) printing
        colorType: Color === 'black and white' ? 'blackwhite':'color' ,  // Set color mode (options: 'color', 'blackwhite')
        jobName: "Sample PDF Print Job"
      });

      // Create a base64 encoded PDF from the blob
      
      const reader = new FileReader();
      reader.readAsDataURL(fileBlob);
      
      reader.onloadend = async () => {
        
        const base64data = reader.result.split(',')[1]; // Get base64 data after the 'data:' prefix
        const printData = [{
          type: 'pdf',
          format: 'base64',
          data: base64data
        }];
        console.log(5)
        await qz.print(config, printData); // Send the print job
        await qz.websocket.disconnect(); // Disconnect from QZ Tray after printing
      };
    } catch (error) {
      console.error('Error printing:', error);
    }
  };
  const handlePrintClick = async (copies,printMode, Color, fileId, parentId, fileName) => {
    const fileBlob = await downloadFile(fileId, parentId, fileName,1);
    if (fileBlob) {
      await printFile(copies,printMode, Color,fileBlob); // Send the downloaded file to the printer
    }
  };
  const downloadFile = async (fileId, parentId, fileName,print) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/upload/${parentId}`, {
        responseType: 'blob',
        params: {
          fileId: fileId
        }
      }, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
        }
      });
      const blob = response.data;
      if(!print){
        const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      }
      

      return blob; // Return the downloaded file blob for further processing (like printing)
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  };

  const updateFileStatus = (parentId, newStatus) => {
    setPdfFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === parentId ? { ...file, status: newStatus } : file
      )
    );
  };

  const markAsComplete = async (parentId) => {
    try {
      console.log(parentId);
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/upload/${parentId}/complete`, { code }, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
        }
      });
      if (response.status === 200) {
        updateFileStatus(parentId, 'complete');
      }
    } catch (error) {
      console.error('Error marking as complete:', error);
      setMsg(`Couldn't mark as complete: ${(parentId.slice(-5))}!`);
      setDoRedirect(false);
      setStatus(false);
      setShowPopup(true);
    }
  };

  const markAsReadyToPick = async (parentId) => {
    try {
      console.log(parentId);
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/upload/${parentId}/readytopick`, {},{
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
        }
      });
      if (response.status === 200) {
        updateFileStatus(parentId, 'readytopick');
      }
    } catch (error) {
      console.error('Error marking as ready to pick:', error);
    }
  };

  const toggleOrderDetails = (parentId) => {
    setExpandedOrderId((prevId) => (prevId === parentId ? null : parentId));
    setExpandedOrders((prev) => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.trim());
  };

  const renderOrders = (orders) => {
    return orders
      .filter(order => order.status === statusFilter)
      .map(order => (
        <div key={order.id} className="order">
          <div className='order-details'>
            <div className='orders-visible'>
            <h3>Username: {order.username} {'\u00A0\u00A0\u00A0\u00A0'} Date: {new Date(order.uploadDate).toLocaleString()}</h3>
            <h3>Order Id: {(order.id).slice(-5)}</h3>
            <div className="order-btns">
            <button className='btn-1 expansion-btn' onClick={() => toggleOrderDetails(order.id)}>
            {expandedOrderId === order.id && expandedOrders[order.id] ? 'Less' : 'More...'}
            </button>
            </div>

            </div>
            
            
         
            {expandedOrderId === order.id && expandedOrders[order.id] && (
              <div>
                <ul className='order-items'>
                  {/* <div className='order-items-desc'>
                    <div>Name</div>
                    <div>Date</div>
                  </div> */}
                  {order.files.map(file => (
                    <div key={file.id} className='printout-item'>
                      <div className='fileName'>{file.name}</div>
                      
                      <button className='btn-2' onClick={() => downloadFile(file.id, order.id, file.name)}>
                        <p className='fileName'>Download {'\u00A0\u00A0\u00A0\u00A0'} {file.name}</p>
                      </button>
                      <button className='btn-2' onClick={() => handlePrintClick(order.copies,order.printMode,order.Color,file.id, order.id, file.name)}>
                        Print {'\u00A0\u00A0\u00A0\u00A0'} {file.name}
                      </button>
                    </div>
                  ))}
                </ul>
                {order.isReport === 'true' ? (
                  <>
                    <p>Report - {order.dept}</p>
                    <p>No. of Copies: {order.numCopies}</p>
                    <p>Extra Instructions: {order.extraInstructions}</p>
                  </>
                ) : (
                  <>
                    <p>Color: {order.Color}</p>
                    <p>No. of Copies: {order.numCopies}</p>
                    <p>Print Mode: {order.printMode}</p>
                    <p>Extra Instructions: {order.extraInstructions}</p>
                  </>
                )}
                {statusFilter === 'readytopick' ? (
                  <>
                    <input type="text" placeholder='Enter the Code given from the customer!' onChange={handleCodeChange} />
                    {code === '' || code === null ? (
                      <button style={{ backgroundColor: 'lightblue', cursor: 'auto' }} className='btn-2'>Mark as Complete</button>
                    ) : (
                      <button className='btn-2' onClick={() => markAsComplete(order.id)}>Mark as Complete</button>
                    )}
                  </>
                ) : statusFilter === 'pending' ? (
                  <button className='btn-2' onClick={() => markAsReadyToPick(order.id)}>Mark as Ready to pick</button>
                ) : null}
              </div>
            )}
          </div>
          
        </div>
      ));
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
      <Button className='btn-1' onClick={() => setShowModal(true)}>Create Print Order</Button>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create a Print Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
          <Form.Group controlId="isReport">
              <Form.Label>isReport:</Form.Label>
              <Form.Control as="select" value={isReport} onChange={(e)=> setIsReport(e.target.value)}>
                <option value={true}>Yes</option>
                <option value={false}>No</option>
              </Form.Control>
            </Form.Group>
            {
              isReport === 'true'?
              (<>
              <Form.Group controlId="department">
              <Form.Label>Department:</Form.Label>
              <Form.Control type="text" placeholder="Enter department" onChange={(e) => setDepartment(e.target.value)} />
            </Form.Group>
            </>):
              (<>
              <Form.Group controlId="printMode">
              <Form.Label>Print Mode:</Form.Label>
              <Form.Control as="select" value={printMode} onChange={(e)=>setPrintMode(e.target.value)}>
                <option value="simplex">Simplex</option>
                <option value="duplex">Duplex</option>
              </Form.Control>
            </Form.Group>
           
            <Form.Group controlId="Color">
              <Form.Label>Color:</Form.Label>
              <Form.Control as="select" value={Color} onChange={(e)=>setColor(e.target.value)}>
                <option value="black and white">Black and White</option>
                <option value="color">Color</option>
              </Form.Control>
            </Form.Group>
            
            
            </>)
            }
             <Form.Group controlId="pages">
              <Form.Label>Specific Pages:</Form.Label>
              <Form.Control type="text" placeholder="Enter specific pages (e.g. 1,3,5)" onChange={(e) => setPages(e.target.value)} />
            </Form.Group>
            <Form.Group controlId="numCopies">
              <Form.Label>Number of Copies:</Form.Label>
              <Form.Control type="text" placeholder="Enter the no. of copies printed" value={numCopies} onChange={(e)=>setNumCopies(e.target.value)} />
            </Form.Group>
            
            <Button className='btn-1' variant="primary" onClick={handleManualPrintout}>
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      <div className='order-search-div'>
        <input
          type='text'
          placeholder='Search by last 5 characters of Printout ID'
          value={searchTerm}
          onChange={handleSearchChange}
          className='search-input'
        />
      </div>
      <section className="order-lists">
        
        <div className="status-btns-div">
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
         </div>
         <div className='orders'>
         {renderOrders(pdfFiles)}
        </div>
       
      </section>
    </div>
     </div>
  );
}

export default PrintoutPage;
