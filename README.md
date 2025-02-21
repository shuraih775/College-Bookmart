# Instructions to Run the Projects

## Client Setup

### 1. Install Dependencies

Run the following command in the root folder (`client`):

```sh
npm install
```

### 2. Add Environment Variables

Create a `.env` file in the root folder (`client`) and add the following environment variables:

```sh
REACT_APP_BACKEND_URL=<your_backend_url>
REACT_APP_RAZOR_PAY_KEY=<generate this from Razorpay website>
```

### 3. Start the Client

Run the development server:

```sh
npm start
```

---

## Admin Panel Setup

### 1. Install Dependencies

Run the following command in the root folder (`admin`):

```sh
npm install
```

### 2. Add Environment Variables

Create a `.env` file in the root folder (`admin`) and add the following:

```sh
REACT_APP_BACKEND_URL=<your_backend_url>
```

### 3. Start the Admin Panel

Run the development server:

```sh
npm start
```

---

## Backend Setup

### 1. Install Dependencies

Run the following command in the root folder (`admin`):

```sh
npm install
```

### 2. Add Environment Variables

Create a `.env` file in the root folder (`admin`) and add the necessary environment variables:

```sh
PORT=<your_port>
DB_URI=<your_database_uri>
SECRET_KEY=<set a secure key>
EMAIL_SERVICE=<your_email_service>
EMAIL_USER=<your_email_username>
EMAIL_PASS=<your_email_password>
```

### 3. Start the Backend Server

Run the server:

```sh
node server.js
```

### 4. Enable Hot Reloading (Optional)

To enable hot reloading, install `nodemon` globally and start the server using:

```sh
npm i -g nodemon
nodemon server.js
```
