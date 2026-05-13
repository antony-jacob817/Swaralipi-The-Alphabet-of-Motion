const API_BASE_URL = 'https://antonyjacob817-swaralipi-api.hf.space';

export const apiRequest = async (method: string, url: string, body?: unknown) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return response;
};
