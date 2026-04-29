import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_ODOO_URL,
    withCredentials: true, // allow browser to send login cookie on every request
    headers: {
        'Content-Type': 'application/json' // tell Odoo we are sending JSON data
    }
})

// Odoo JSON-RPC wrapper — exported so other API files can reuse it
export const rpc = (endpoint, params = {}) =>
    api.post(endpoint, { jsonrpc: "2.0", method: "call", id: Date.now(), params })

export const authAPI = {
    login:      (db, login, password) => rpc('/web/session/authenticate', { db, login, password }),
    logout:     ()                    => rpc('/web/session/destroy'),
    getSession: ()                    => rpc('/web/session/get_session_info'),
}