import axios from "axios";

// ✅ Use environment variable, fallback to localhost for development
const API = axios.create({
    baseURL: "https://ai-interview-platform-h5aq.onrender.com",
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token")

    if (token){
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
})

API.interceptors.response.use(res => res, (error) => {
    if(error.response?.status == 401){
        localStorage.removeItem("token");
        window.location.href = "/"
    }
    return Promise.reject(error);
})

export default API;