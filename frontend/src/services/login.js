import axiosInstance from './axios';

const login = async (credentials) => {
  const response = await axiosInstance.post('/login', credentials);
  const data = response.data;
  
  // Add token expiration time (15 minutes from now)
  data.tokenExpiration = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  
  return data;
};

export default { login };
