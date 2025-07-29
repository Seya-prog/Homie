const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class FaydaService {
  constructor() {
    this.clientId = process.env.FAYDA_CLIENT_ID;
    this.redirectUri = process.env.FAYDA_REDIRECT_URI;
    this.authorizationEndpoint = process.env.FAYDA_AUTHORIZATION_ENDPOINT;
    this.tokenEndpoint = process.env.FAYDA_TOKEN_ENDPOINT;
    this.userinfoEndpoint = process.env.FAYDA_USERINFO_ENDPOINT;
    this.algorithm = process.env.FAYDA_ALGORITHM || 'RS256';
    this.clientAssertionType = process.env.FAYDA_CLIENT_ASSERTION_TYPE;
  }

  /**
   * Generate authorization URL for Fayda OAuth flow
   * @param {string} state - Random state parameter for security
   * @param {string} nonce - Random nonce for ID token validation
   * @returns {string} Authorization URL
   */
  generateAuthorizationUrl(state, nonce) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile',
      state: state || uuidv4(),
      nonce: nonce || uuidv4(),
      display: 'page',
      prompt: 'consent',
      max_age: '21600', // 6 hours
      claims: JSON.stringify({
        userinfo: {
          given_name: { essential: true },
          family_name: { essential: true },
          birthdate: { essential: true },
          gender: { essential: true },
          phone_number: { essential: true },
          email: { essential: true },
          address: { essential: true },
          picture: { essential: false }
        }
      })
    });

    return `${this.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Generate client assertion JWT for token exchange
   * @returns {string} JWT client assertion
   */
  generateClientAssertion() {
    const payload = {
      iss: this.clientId,
      sub: this.clientId,
      aud: this.tokenEndpoint,
      jti: uuidv4(),
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      iat: Math.floor(Date.now() / 1000)
    };

    // Note: In production, you should use proper RSA private key for RS256
    // For development, using HS256 with a secret
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.sign(payload, secret, { algorithm: 'HS256' });
  }

  /**
   * Exchange authorization code for access token
   * @param {string} authorizationCode - Authorization code from callback
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(authorizationCode) {
    try {
      const clientAssertion = this.generateClientAssertion();
      
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_assertion_type: this.clientAssertionType,
        client_assertion: clientAssertion
      });

      const response = await axios.post(this.tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw new Error(`Failed to exchange code for token: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get user information from Fayda
   * @param {string} accessToken - Access token from token exchange
   * @returns {Promise<Object>} User information
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(this.userinfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Get user info error:', error.response?.data || error.message);
      throw new Error(`Failed to get user info: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Verify user identity and complete KYC process
   * @param {string} authorizationCode - Authorization code from callback
   * @returns {Promise<Object>} Complete user verification data
   */
  async verifyUserIdentity(authorizationCode) {
    try {
      // Step 1: Exchange code for token
      const tokenData = await this.exchangeCodeForToken(authorizationCode);
      
      // Step 2: Get user information
      const userInfo = await this.getUserInfo(tokenData.access_token);
      
      // Step 3: Process and standardize user data
      const verificationData = {
        faydaId: userInfo.sub,
        personalInfo: {
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          email: userInfo.email,
          phone: userInfo.phone_number,
          birthdate: userInfo.birthdate,
          gender: userInfo.gender,
          address: userInfo.address,
          picture: userInfo.picture
        },
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        tokenData: {
          accessToken: tokenData.access_token,
          tokenType: tokenData.token_type,
          expiresIn: tokenData.expires_in,
          scope: tokenData.scope
        },
        rawData: userInfo
      };

      return verificationData;
    } catch (error) {
      console.error('User verification error:', error);
      throw error;
    }
  }

  /**
   * Validate ID token (if using OIDC flow)
   * @param {string} idToken - ID token to validate
   * @param {string} nonce - Original nonce used in authorization request
   * @returns {Object} Decoded and validated token
   */
  validateIdToken(idToken, nonce) {
    try {
      // Note: In production, you should verify the token signature with Fayda's public key
      const decoded = jwt.decode(idToken, { complete: true });
      
      if (!decoded) {
        throw new Error('Invalid ID token format');
      }

      const payload = decoded.payload;
      
      // Basic validations
      if (payload.iss !== this.authorizationEndpoint.replace('/authorize', '')) {
        throw new Error('Invalid issuer');
      }
      
      if (payload.aud !== this.clientId) {
        throw new Error('Invalid audience');
      }
      
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }
      
      if (payload.nonce !== nonce) {
        throw new Error('Invalid nonce');
      }

      return payload;
    } catch (error) {
      console.error('ID token validation error:', error);
      throw error;
    }
  }

  /**
   * Check KYC status for a user
   * @param {string} faydaId - Fayda ID of the user
   * @returns {Promise<Object>} KYC status information
   */
  async checkKYCStatus(faydaId) {
    // This would typically involve checking with Fayda's API
    // For now, we'll return a mock response
    return {
      faydaId,
      status: 'VERIFIED',
      lastChecked: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };
  }

  /**
   * Generate test credentials for development
   * @returns {Object} Test user data
   */
  generateTestCredentials() {
    const testFin = '614079852391519';
    const testOtp = '111111';
    
    return {
      testFin,
      testOtp,
      authUrl: this.generateAuthorizationUrl('test-state', 'test-nonce'),
      clientId: this.clientId,
      redirectUri: this.redirectUri
    };
  }
}

module.exports = new FaydaService();