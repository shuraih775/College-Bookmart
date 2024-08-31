// import React, { useEffect } from "react";
// import "bootstrap/dist/css/bootstrap.min.css";
import Carousel from "react-bootstrap/Carousel";
import '../styles/home.css';

export default function HomePage() {
  return (
    <div className="Home">
      <Carousel>
        <Carousel.Item interval={1000}>
          <img
            src="/bookstore-corosouel.jpg"
            alt="bookstore"
            text="OneStop-BookMart"
            className="home-img"
          />
          <Carousel.Caption>
            <h3>OneStop-BookMart</h3>
            <p className="caro-text">
              Discover a World of Knowledge and Imagination at Bookmart – Your
              One-Stop Destination for Quality Stationery, Reliable Printout
              Services, and More.
            </p>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item interval={500}>
          <img
            src="/stat-corosouel.jpg"
            alt="stationery"
            text="Stationery Items"
            className="home-img"
          />
          <Carousel.Caption>
            <h3>Stationery Items</h3>
            <p className="caro-text">
              Unleash Creativity with Our Stationery Collection – Where Every
              Blank Page Holds the Potential for Inspiration!
            </p>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img src="/print-corosouel.jpg" alt="print" text="Third slide"  className="home-img"/>
          <Carousel.Caption>
            <h3>Prints</h3>
            <p className="caro-text">
              Bring Your Ideas to Life with Precision and Clarity – Explore Our
              Printout Services for Crisp and Vibrant Documents!
            </p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>

      <section className="content">
        <p>Explore our collection of college books and stationery items.</p>
      </section>
    </div>
  );
}
