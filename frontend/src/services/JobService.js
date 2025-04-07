import api from '../utils/api';

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


export const getJobs = async () => {
  try {
    const response = await api.get('/tasks');
    return response.data.data;
  } catch (err) {
    console.error('Get jobs error:', err);
    throw new Error(err.response?.data?.error || 'Failed to fetch jobs');
  }
};
