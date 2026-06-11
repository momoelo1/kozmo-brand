import axiosInstance from './axios';

const postUser = async (newObject) => {
  const response = await axiosInstance.post('/users', newObject);
  return response.data;
};

export default { postUser };
