import React from 'react';

const Home = () => {
  return (
    <div className="container">
      <h1>Village Task Connect</h1>
      <p>A Digital Marketplace for Rural Services</p>
      <div className="features">
        <div className="feature">
          <h3>Find Work</h3>
          <p>Discover job opportunities in your village.</p>
        </div>
        <div className="feature">
          <h3>Hire Workers</h3>
          <p>Find qualified workers for your tasks.</p>
        </div>
        <div className="feature">
          <h3>Secure Payments</h3>
          <p>Handle payments safely through mobile money.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;