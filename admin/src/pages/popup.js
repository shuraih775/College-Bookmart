import React, { useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/popup.css';  // Import the CSS file for styling

const Popup = ({ message, onClose, status, doRedirect }) => {
  useEffect(() => {
    let timer;

    // Set a timeout to automatically close the popup after 2 seconds
    timer = setTimeout(() => {
      onClose(doRedirect);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose, status, doRedirect]);

  return (
    <Modal show={true} onHide={() => onClose(doRedirect)} centered className={status ? 'popup-success' : 'popup-error'}>
      <Modal.Body className="popup-body">
        <div className={`popup-icon ${status ? 'green-tick' : 'red-exclamation'}`}>
          {status ? '✔' : '⚠'}
        </div>
        <div className="popup-message">{message}</div>
      </Modal.Body>
    </Modal>
  );
};

export default Popup;
