import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Table, Form, Button, Modal } from 'react-bootstrap';
import '../styles/statistic.css';

const Statistics = () => {
  const [activities, setActivities] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [activitiesTotalRevenue, setActivitiesTotalRevenue] = useState(0);
  const [activitiesTotalProfit, setActivitiesTotalProfit] = useState(0);
  const [printTotalRevenue, setPrintTotalRevenue] = useState(0);
  const [printTotalProfit, setPrintTotalProfit] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [viewType, setViewType] = useState('monthly'); // Added state to manage view type
  const [showModal, setShowModal] = useState(false);

  const fetchStatistics = useCallback(async () => {
    try {
      let response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/upload/statistics`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
        },
        params: { month, year }
      });
      
      setPrintTotalProfit(response.data.totalProfit);
      setPrintTotalRevenue(response.data.totalRevenue);
      
      response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/product/statistics`,  {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
        }
      ,
        params: { month, year }
      });
      setActivities(response.data.activities);

      let revenue = 0;
      let profit = 0;
      response.data.activities.forEach(activity => {
        if (activity.activityType === 'add') {
          revenue += activity.price * activity.quantity;
        } else if (activity.activityType === 'sell') {
          profit += activity.price * activity.quantity;
        } else if (activity.activityType === 'sellCancel') {
          profit -= activity.price * activity.quantity;
        }
      });
      setActivitiesTotalRevenue(revenue);
      setActivitiesTotalProfit(profit);

      setTotalRevenue(revenue + printTotalRevenue);
      setTotalProfit(profit + printTotalProfit);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, [month, year, printTotalRevenue, printTotalProfit]);

  useEffect(() => {
    fetchStatistics();
  }, [month, year, fetchStatistics]);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div className="statistics-container children">
      <h1 className="statistics-header">{viewType === 'monthly' ? 'Monthly' : 'Yearly'} Statistics</h1>
      <Form inline>
        <Form.Group>
          <Form.Label>View</Form.Label>
          <Form.Control
            as="select"
            value={viewType}
            onChange={(e) => {
              setViewType(e.target.value);
              setMonth(new Date().getMonth() + 1); // Reset month to current for yearly view
              setYear(new Date().getFullYear()); // Reset year to current
            }}
            className="ml-2"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Form.Control>
        </Form.Group>
        {viewType === 'monthly' && (
          <>
            <Form.Group>
              <Form.Label className="ml-4">Month</Form.Label>
              <Form.Control
                type="number"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                min="1"
                max="12"
                className="ml-2"
              />
            </Form.Group>
          </>
        )}
        <Form.Group>
          <Form.Label className="ml-4">Year</Form.Label>
          <Form.Control
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="ml-2"
          />
        </Form.Group>
        <Button className="ml-4 fetch-button" onClick={fetchStatistics}>Fetch</Button>
      </Form>
      <div className='total-stat'>
        <h3>Total Revenue: Rs. {totalRevenue}</h3>
        <h3>Total Profit: Rs. {totalProfit}</h3>
      </div>

      <div className='stationery-stat'>
        <p>Revenue through Stationery: Rs. {activitiesTotalRevenue}</p>
        <p>Profit through Stationery: Rs. {activitiesTotalProfit}</p>
      </div>

      <Button variant="primary" onClick={handleShowModal}>Show Details</Button>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Activity Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="modal-body">
            <Table striped bordered hover>
              <thead className="table-header">
                <tr>
                  <th>Date</th>
                  <th>Product Name</th>
                  <th>Type</th>
                  <th>SubType</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Activity Type</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(activity => (
                  <tr key={activity._id}>
                    <td>{new Date(activity.date).toLocaleDateString()}</td>
                    <td>{activity.name}</td>
                    <td>{activity.type}</td>
                    <td>{activity.subtype}</td>
                    <td>{activity.quantity}</td>
                    <td>{activity.price}</td>
                    <td>{activity.activityType}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
        </Modal.Footer>
      </Modal>
      <div className='printout-stat'>
        <p>Revenue through Printouts: Rs. {printTotalRevenue}</p>
        <p>Profit through Printouts: Rs. {printTotalProfit}</p>
      </div>
    </div>
  );
};

export default Statistics;
