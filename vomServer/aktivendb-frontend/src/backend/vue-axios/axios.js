import axios from 'axios'

const API_URL = process.env.API_URL;

export default axios.create({
  name: "axios",
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.token
  }
})