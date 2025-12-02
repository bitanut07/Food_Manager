import axios from 'axios';
import { API_BASE_URL } from '../Config/apiConfig';

export const fetchFeedbacksData = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/booking/feedbacks/`);
        return response.data;
    }
    catch(error) {
        throw error;
    }
}

export const getFeedBackFilter = async (positive, date) => {
    try {
        let rate = '';
        let isFilter = '?';
        if (positive === '0' && date === 'a') {
            isFilter = '';
        }
        if (positive === '0') {
            rate = '';
        }
        else if (positive === '1') {
            rate = 'min_ovrpoint=0&max_ovrpoint=1&'
        }
        else if (positive === '2'){
            rate = 'min_ovrpoint=1&max_ovrpoint=2&'
        }
        else if (positive === '3') {
            rate = 'min_ovrpoint=2&max_ovrpoint=3&'
        }
        else if (positive === '4') {
            rate = 'min_ovrpoint=3&max_ovrpoint=4&'
        }
        else if (positive === '5') {
            rate = 'min_ovrpoint=4&max_ovrpoint=5&'
        }
        if (date === 'a') {
            date = '';
        }
        else {
            date = `date=${date}`;
        }
        const response = await axios.get(`${API_BASE_URL}/booking/feedbacks/${isFilter}${rate}${date}`);
        return response.data;
    }
    catch(error) {
        throw error;
    }
}

export const createFeedBack = async (oID, name, servep, foodp, pricep,spacep,comment) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/booking/feedbacks/`, {
            order: oID,
            name: name,
            serve_point: servep,
            food_point: foodp,
            price_point: pricep,
            space_point: spacep,
            comment: comment,
        });
        return response.data;
    }
    catch(error) {
        throw error;
    }
}
