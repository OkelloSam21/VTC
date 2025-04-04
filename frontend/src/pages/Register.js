import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    password2: '',
    village: '',
    skills: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { name, phone, password, password2, village, skills } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const onSubmit = async e => {
    e.preventDefault();
    setError('');

    if (password !== password2) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const formattedSkills = skills.split(',').map(skill => skill.trim());
      await register({
        name,
        phone,
        password,
        village,
        skills: formattedSkills
      });
      // Redirect to jobs page on successful registration
      navigate('/jobs');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Register</h1>
      <p className="lead">Create your account</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <form className="form" onSubmit={onSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="text"
            name="phone"
            value={phone}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            name="password2"
            value={password2}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Village</label>
          <input
            type="text"
            name="village"
            value={village}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Skills (comma separated)</label>
          <input
            type="text"
            name="skills"
            value={skills}
            onChange={onChange}
            placeholder="e.g. carpentry, plumbing, farming"
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="my-1">
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
};

export default Register;