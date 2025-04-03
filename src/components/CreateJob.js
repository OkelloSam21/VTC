import React, { useState } from 'react';
import { createJob } from '../services/JobService';

const CreateJob = ({ onJobCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    village: '',
    amount: '',
    negotiable: false,
    requiredSkills: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { title, description, village, amount, negotiable, requiredSkills } = formData;

  const onChange = e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const jobData = {
        title,
        description,
        location: {
          village,
          coordinates: {} // We'll add actual coordinates later
        },
        payment: {
          amount: Number(amount),
          negotiable
        },
        requiredSkills: requiredSkills.split(',').map(skill => skill.trim())
      };

      const newJob = await createJob(jobData);
      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        village: '',
        amount: '',
        negotiable: false,
        requiredSkills: ''
      });
      
      if (onJobCreated) {
        onJobCreated(newJob);
      }
    } catch (err) {
      setError(err.message || 'Failed to create job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-job">
      <h2>Post a New Job</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">Job posted successfully!</div>}
      <form className="form" onSubmit={onSubmit}>
        <div className="form-group">
          <label>Job Title</label>
          <input
            type="text"
            name="title"
            value={title}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={description}
            onChange={onChange}
            required
          ></textarea>
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
          <label>Payment Amount (KSH)</label>
          <input
            type="number"
            name="amount"
            value={amount}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group checkbox">
          <input
            type="checkbox"
            name="negotiable"
            checked={negotiable}
            onChange={onChange}
            id="negotiable"
          />
          <label htmlFor="negotiable">Payment is negotiable</label>
        </div>
        <div className="form-group">
          <label>Required Skills (comma separated)</label>
          <input
            type="text"
            name="requiredSkills"
            value={requiredSkills}
            onChange={onChange}
            placeholder="e.g. carpentry, plumbing, farming"
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  );
};

export default CreateJob;