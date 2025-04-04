import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateJob from '../components/CreateJob';
import { getJobs } from '../services/JobService';
import { isAuthenticated } from '../services/authService';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsData = await getJobs();
        setJobs(jobsData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch jobs. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const addNewJob = (job) => {
    setJobs([job, ...jobs]);
  };

  return (
    <div className="container">
      <div className="jobs-container">
        <div className="jobs-list-section">
          <h1>Available Jobs</h1>
          {error && <div className="alert alert-danger">{error}</div>}
          {loading ? (
            <p>Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p>No jobs available at the moment.</p>
          ) : (
            <div className="job-list">
              {jobs.map(job => (
                <div key={job._id} className="job-card">
                  <h3>{job.title}</h3>
                  <p>{job.description}</p>
                  <div className="job-details">
                    <p><strong>Location:</strong> {job.location.village}</p>
                    <p><strong>Payment:</strong> KSH {job.payment.amount} {job.payment.negotiable ? '(Negotiable)' : ''}</p>
                    <p><strong>Status:</strong> <span className={`status status-${job.status}`}>{job.status}</span></p>
                    {job.employer && (
                      <p><strong>Posted by:</strong> {job.employer.name}</p>
                    )}
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      if (!isAuthenticated()) {
                        navigate('/login');
                      } else {
                        // We'll implement the apply functionality later
                        console.log('Apply for job:', job._id);
                      }
                    }}
                  >
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="create-job-section">
          {isAuthenticated() ? (
            <CreateJob onJobCreated={addNewJob} />
          ) : (
            <div className="auth-prompt">
              <h3>Want to post a job?</h3>
              <p>Please login or register to post new jobs.</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/login')}
              >
                Login / Register
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;