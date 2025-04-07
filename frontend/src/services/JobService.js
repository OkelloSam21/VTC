import api from '../utils/api';

// Get a single job by ID
export const getJobById = async (jobId) => {
  try {
    const response = await api.get(`/v1/tasks/${jobId}`);
    return response.data.data;
  } catch (err) {
    console.error('Get job error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error || 'Failed to fetch job details');
  }
};

// Create a new job
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
