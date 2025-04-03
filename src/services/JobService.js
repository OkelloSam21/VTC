import api from '../utils/api';

// Get all jobs
export const getJobs = async () => {
  try {
    const response = await api.get('/jobs');
    return response.data;
  } catch (err) {
    throw err.response.data;
  }
};

// Get single job by ID
export const getJobById = async (jobId) => {
  try {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  } catch (err) {
    throw err.response.data;
  }
};

// Create new job
export const createJob = async (jobData) => {
  try {
    const response = await api.post('/jobs', jobData);
    return response.data;
  } catch (err) {
    throw err.response.data;
  }
};

// Update job
export const updateJob = async (jobId, jobData) => {
  try {
    const response = await api.put(`/jobs/${jobId}`, jobData);
    return response.data;
  } catch (err) {
    throw err.response.data;
  }
};