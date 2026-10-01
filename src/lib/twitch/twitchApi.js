const axios = require('axios');

class TwitchClient {
    constructor() {
        this.accessToken = null,
        this.tokenExpiry = null,
        this.clientId = process.env.TWITCH_CLIENT_ID,
        this.clientSecret = process.env.TWITCH_CLIENT_SECRET

    }

    async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        if (!this.clientId || !this.clientSecret) {
            throw new Error('Variables TWITCH_CLIENT_ID et TWITCH_CLIENT_SECRET manquantes dans .env');
        }

        try {
            const res = await axios.post('https://id.twitch.tv/oauth2/token', null, {
                params: {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'client_credentials'
                }
            }
        );

        this.accessToken = res.data.access_token;
    this.tokenExpiry = Date.now() + (res.data.expires_in * 1000) - 60000;
        return this.accessToken;
        } 
        
        catch (err) {
            console.error('❌ Erreur lors de la récupération du token Twitch', err);
            throw err;
        }
    }

    async getStreams(logins) {
        if (!logins.length) return [];

        const token = await this.getAccessToken();
        const params = new URLSearchParams();

        logins.forEach(login => params.append('user_login', login));

        try {
            const res = await axios.get(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
                headers: {
                    'Client-ID': this.clientId,
                    'Authorization': `Bearer ${token}`
                }
            });

            // console.log('✅ Streams Twitch récupérés', res.data.data);
            return res.data.data;
        }
        catch (err) {
            console.error('❌ Erreur lors de la récupération des streams Twitch', err);
            throw err;
        }
    }

    async getUserByName(login) {
        const token = await this.getAccessToken();
        
        const res = await axios.get(`https://api.twitch.tv/helix/users?login=${login}`, {
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${token}`
            },
        });

        return res.data.data[0] || null;
    }
}

module.exports = TwitchClient;