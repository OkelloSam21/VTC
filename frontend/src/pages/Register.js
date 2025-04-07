import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import { getSkills } from '../services/JobService';
import { getCounties, getSubCounties, getVillages } from '../services/LocationService';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    nationalId: '',
    password: '',
    password2: '',
    role: 'employer', // Default to employer
    county: '',
    subCounty: '',
    village: '',
    highestLevel: 'primary',
    specialization: '',
    skills: []
  });
  
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [villages, setVillages] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    name,
    phoneNumber,
    nationalId,
    password,
    password2,
    role,
    county,
    subCounty,
    village,
    highestLevel,
    specialization,
    skills
  } = formData;

  // Fetch counties and skills on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countiesData, skillsData] = await Promise.all([
          getCounties(),
          getSkills()
        ]);
        
        setCounties(countiesData || []);
        setAvailableSkills(skillsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  // Fetch sub counties when county changes
  useEffect(() => {
    if (county) {
      const fetchSubCounties = async () => {
        try {
          const data = await getSubCounties(county);
          setSubCounties(data || []);
          setFormData({ ...formData, subCounty: '', village: '' });
        } catch (err) {
          console.error('Error fetching sub counties:', err);
        }
      };

      fetchSubCounties();
    }
  }, [county]);

  // Fetch villages when sub county changes
  useEffect(() => {
    if (county && subCounty) {
      const fetchVillages = async () => {
        try {
          const data = await getVillages(county, subCounty);
          setVillages(data || []);
          setFormData({ ...formData, village: '' });
        } catch (err) {
          console.error('Error fetching villages:', err);
        }
      };

      fetchVillages();
    }
  }, [county, subCounty]);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSkillChange = e => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, skills: selectedOptions });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setError('');

    if (password !== password2) {
      setError('Passwords do not match');
      return;
    }

    if (!county || !subCounty || !village) {
      setError('Please select your location');
      return;
    }

    if (role === 'tasker' && skills.length === 0) {
      setError('Taskers must select at least one skill');
      return;
    }

    setLoading(true);

    try {
      // Format data to match backend expectations
      const userData = {
        name,
        phoneNumber,
        nationalId,
        password,
        role,
        location: {
          county,
          subCounty,
          village
        }
      };

      // Add tasker-specific fields
      if (role === 'tasker') {
        userData.education = {
          highestLevel,
          specialization
        };
        userData.skills = skills;
      }

      await register(userData);
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
          <label>Account Type</label>
          <select
            name="role"
            value={role}
            onChange={onChange}
            required
          >
            <option value="employer">Employer (Post Jobs)</option>
            <option value="tasker">Tasker (Find Work)</option>
          </select>
        </div>

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
            name="phoneNumber"
            value={phoneNumber}
            onChange={onChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>National ID</label>
          <input
            type="text"
            name="nationalId"
            value={nationalId}
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
          <label>County</label>
          <select
            name="county"
            value={county}
            onChange={onChange}
            required
          >
            <option value="">Select County</option>
            {counties.map((countyName, index) => (
              <option key={index} value={countyName}>{countyName}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Sub-County</label>
          <select
            name="subCounty"
            value={subCounty}
            onChange={onChange}
            required
            disabled={!county}
          >
            <option value="">Select Sub-County</option>
            {subCounties.map((subCountyName, index) => (
              <option key={index} value={subCountyName}>{subCountyName}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Village</label>
          <select
            name="village"
            value={village}
            onChange={onChange}
            required
            disabled={!subCounty}
          >
            <option value="">Select Village</option>
            {villages.map((villageName, index) => (
              <option key={index} value={villageName}>{villageName}</option>
            ))}
          </select>
        </div>
        
        {role === 'tasker' && (
          <>
            <div className="form-group">
              <label>Education Level</label>
              <select
                name="highestLevel"
                value={highestLevel}
                onChange={onChange}
                required
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="college/university">College/University</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Specialization</label>
              <input
                type="text"
                name="specialization"
                value={specialization}
                onChange={onChange}
                placeholder="What is your area of expertise?"
              />
            </div>
            
            <div className="form-group">
              <label>Skills (hold Ctrl/Cmd to select multiple)</label>
              <select
                multiple
                name="skills"
                value={skills}
                onChange={onSkillChange}
                required
                className="skills-select"
              >
                {availableSkills.map(skill => (
                  <option key={skill._id} value={skill._id}>
                    {skill.name} ({skill.category})
                  </option>
                ))}
              </select>
              <small>Selected skills: {skills.length}</small>
            </div>
          </>
        )}
        
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