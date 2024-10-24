import axios from 'axios';
import { ALLOWED_ORIGIN } from '../routes/lib/apis.js';

class PayPalClient {
    constructor() {
        this.clientId = process.env.PAYPAL_CLIENT_ID;
        this.secret = process.env.PAYPAL_CLIENT_SECRET;
        this.baseUri = 'https://api-m.sandbox.paypal.com'; // Cambia esto según el entorno
        this.accessToken = null;
    }
    async getAccessToken() {
        if (this.accessToken) {
            return this.accessToken;
        }
        console.log(this.clientId, this.secret)
        try {
            const response = await axios.post(`${this.baseUri}/v1/oauth2/token`,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    auth: {
                        username: this.clientId,
                        password: this.secret
                    },
                }
            );

            this.accessToken = response.data.access_token;
            console.log('Access token obtained:', this.accessToken); // Agrega un log para verificar el token
            return this.accessToken;
        } catch (error) {
            console.error('Error getting access token:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    getHeaders() {
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
        };
    }

    async createProduct(name, description, type = 'SERVICE') {
        await this.getAccessToken();

        try {
            const response = await axios.post(`${this.baseUri}/v1/catalogs/products`,
                { name, description, type },
                { headers: this.getHeaders() }
            );

            return response.data;
        } catch (error) {
            console.error('Error creating product:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async createPlan(productId, planId, price, intervalUnit = 'MONTH', intervalCount = 1, totalCycles = 12) {
        await this.getAccessToken();

        try {
            const response = await axios.post(`${this.baseUri}/v1/billing/plans`,
                {
                    "product_id": productId,
                    "name": planId,
                    "billing_cycles": [
                        {
                            "tenure_type": "TRIAL",
                            "sequence": 1,
                            "frequency": {
                                "interval_unit": "MONTH",
                                "interval_count": 1
                            },
                            "total_cycles": 2,
                            "pricing_scheme": {
                                "fixed_price": {
                                    "value": price,
                                    "currency_code": "USD"
                                }
                            }
                        },
                        {
                            "frequency": {
                                "interval_unit": "MONTH",
                                "interval_count": 1
                            },
                            "tenure_type": "TRIAL",
                            "sequence": 2,
                            "total_cycles": 3,
                            "pricing_scheme": {
                                "fixed_price": {
                                    "value": price,
                                    "currency_code": "USD"
                                }
                            }
                        },
                        {
                            "frequency": {
                                "interval_unit": "MONTH",
                                "interval_count": 1
                            },
                            "tenure_type": "REGULAR",
                            "sequence": 3,
                            "total_cycles": 12,
                            "pricing_scheme": {
                                "fixed_price": {
                                    "value": price,
                                    "currency_code": "USD"
                                }
                            }
                        }
                    ],
                    "payment_preferences": {
                        "auto_bill_outstanding": true,
                        "setup_fee": {
                            "value": "0",
                            "currency_code": "USD"
                        },
                        "setup_fee_failure_action": "CONTINUE",
                        "payment_failure_threshold": 3
                    },
                    "description": "Video Streaming Service basic plan",
                    "status": "ACTIVE",
                    "taxes": {
                        "percentage": "00",
                        "inclusive": false
                    }
                },
                { headers: this.getHeaders() }
            );

            return response.data;
        } catch (error) {
            console.error('Error creating plan:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async createSubscription(planId) {
        await this.getAccessToken();

        try {
            const response = await axios.post(`${this.baseUri}/v1/billing/subscriptions`,
                {
                    plan_id: planId,
                    application_context: {
                        brand_name: "chetiendas",
                        user_action: "SUBSCRIBE_NOW",
                        return_url: `${ALLOWED_ORIGIN}/p`,// redirigir al inicio del administrador
                        cancel_url: `${ALLOWED_ORIGIN}/`,
                    }
                },
                { headers: this.getHeaders() }
            );

            return response.data;
        } catch (error) {
            console.error('Error creating subscription:', error.response ? error.response.data : error.message);
            throw error;
        }
    }



   



    async getPlans() {
        await this.getAccessToken();

        try {
            const response = await axios.get(`${this.baseUri}/v1/billing/plans`,
                { headers: this.getHeaders() }
            );

            return response.data;
        } catch (error) {
            console.error('Error getting plans:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
}

export default PayPalClient;
