// services/LocationService.js
import api from "../utils/api";

// Get all counties
export const getCounties = async () => {
  try {
    const response = await api.get('/locations/counties');
    return response.data.data;
  } catch (err) {
    console.error('Get counties error:', err);
    return [];
  }
};

// Get subcounties by county
export const getSubCounties = async (county) => {
  try {
    const response = await api.get(`/locations/county/${county}/subcounties`);
    return response.data.data;
  } catch (err) {
    console.error('Get subcounties error:', err);
    return [];
  }
};

// Get villages by county and subcounty
export const getVillages = async (county, subCounty) => {
  try {
    const response = await api.get(`/locations/county/${county}/subcounty/${subCounty}/villages`);
    return response.data.data;
  } catch (err) {
    console.error('Get villages error:', err);
    return [];
  }
};