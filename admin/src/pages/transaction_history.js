import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/transactions.css'

function TransactionHistory() {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/transaction/`, {
                    headers: {
                        Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminToken'))}`
                    },
                });
                setTransactions(response.data.transactions);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        };

        fetchTransactions();
    }, []);

    return (
        <div>
            <h2>Transaction History</h2>
            <ul className='transactions'>
                {transactions.map((transaction) => (
                    <div key={transaction._id} className='transaction'>
                        <p><strong>Transaction ID:</strong> {transaction.transactionId}
                        {'\t'}
                        <span style={{color:'#ccc'}}>|</span>
                        {'\t'}
                        <strong> Order ID:</strong> {transaction.orderId}
                        {'\t'}
                        <span style={{color:'#ccc'}}>|</span>
                        {'\t'}
                         <strong> Date:</strong> {new Date(transaction.date).toLocaleString()} 
                         {'\t'}
                        <span style={{color:'#ccc'}}>|</span>
                        {'\t'}
                         <strong> Amount:</strong> {transaction.bill_amt}
                         {'\t'}
                        <span style={{color:'#ccc'}}>|</span>
                        {'\t'}
                        <strong>Type:</strong> {transaction.transactionFor}</p>
                        
                    </div>
                ))}
            </ul>
        </div>
    );
}

export default TransactionHistory;
