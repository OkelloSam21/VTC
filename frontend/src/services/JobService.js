// services/JobService.js
import api from './api';

// Get all jobs
export const getJobs = async () => {
  try {
    const response = await api.get('/v1/tasks');
    return response.data.data;
  } catch (err) {
    console.error('Get jobs error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error || 'Failed to fetch jobs');
  }
};

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
    // Format the data to match backend expectations
    const formattedData = {
      title: jobData.title,
      description: jobData.description,
      location: {
        county: jobData.location.county || 'Default County',
        subCounty: jobData.location.subCounty || 'Default SubCounty',
        village: jobData.location.village
      },
      payment: {
        amount: jobData.payment.amount,
        status: 'pending'
      },
      requiredSkills: jobData.requiredSkills || []
    };

    const response = await api.post('/v1/tasks', formattedData);
    return response.data.data;
  } catch (err) {
    console.error('Create job error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error || 'Failed to create job');
  }
};

// Apply for a job (create a connection)
export const applyForJob = async (taskId) => {
  try {
    const response = await api.post('/v1/connections', {
      taskId
    });
    return response.data.data;
  } catch (err) {
    console.error('Apply for job error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error || 'Failed to apply for job');
  }
};

// Get my tasks (jobs I created as an employer or jobs assigned to me as a tasker)
export const getMyTasks = async () => {
  try {
    const response = await api.get('/v1/tasks/my-tasks');
    return response.data.data;
  } catch (err) {
    console.error('Get my tasks error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error || 'Failed to fetch your tasks');
  }
};

// Get my connections
export const getMyConnections = async () => {
  try {
    const response = await api.get('/v1/connections/my-connections');
    return response.data.data;
  } catch (err) {
    console.error('Get my connections error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error || 'Failed to fetch your connections');
  }
};