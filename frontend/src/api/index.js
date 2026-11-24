import axios from 'axios';

export const apiURL = process.env.REACT_APP_API_URL || '/api';
export const assetOrigin = new URL(apiURL, window.location.origin).origin;
export function assetURL(value) {
  if (!value) return '/images/armoriar.png';
  if (/^https?:\/\//i.test(value)) return value;
  const local = '/' + value.replace(/^\/?public\//, '').replace(/^\/+/, '');
  return local.startsWith('/images/') ? local : assetOrigin + local;
}
const api = axios.create({ baseURL: apiURL });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('intergil_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
