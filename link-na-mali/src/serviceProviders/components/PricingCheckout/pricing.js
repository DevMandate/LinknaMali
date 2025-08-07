import axios from "axios";

const BASE_URL = "https://api.linknamali.ke";

export const fetchTiers = () => axios.get(`${BASE_URL}/fetchpremiumtiers`);
export const fetchFeatures = () => axios.get(`${BASE_URL}/fetchtierfeatures`);
export const fetchAddOns = () => axios.get(`${BASE_URL}/fetchaddons`);
export const fetchPromotions = () => axios.get(`${BASE_URL}/fetchpromotions`);
