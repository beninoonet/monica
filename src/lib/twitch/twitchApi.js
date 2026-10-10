const axios = require('axios');

class TwitchClient {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = 0;
        this.clientId = process.env.TWITCH_CLIENT_ID;
        this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
    }

    async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiry) return this.accessToken;
        if (!this.clientId || !this.clientSecret) {
            throw new Error('Variables TWITCH_CLIENT_ID et TWITCH_CLIENT_SECRET manquantes dans .env');
        }

        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'client_credentials'
            }
        });
        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
        return this.accessToken;
    }

    getHeaders(token) {
        return {
            'Client-ID': this.clientId,
            Authorization: `Bearer ${token}`
        };
    }

    async getStreams(logins) {
        if (!logins.length) return [];
        const token = await this.getAccessToken();
        const params = new URLSearchParams();
        logins.forEach((login) => params.append('user_login', login));
        const response = await axios.get(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
            headers: this.getHeaders(token)
        });
        return response.data.data;
    }

    async getUserByName(login) {
        const token = await this.getAccessToken();
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            params: { login },
            headers: this.getHeaders(token)
        });
        return response.data.data[0] || null;
    }
}

module.exports = TwitchClient;
