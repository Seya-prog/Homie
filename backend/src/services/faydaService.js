const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { SignJWT, importJWK } = require('jose');

class FaydaService {
  constructor() {
    this.clientId = process.env.FAYDA_CLIENT_ID;
    this.redirectUri = process.env.FAYDA_REDIRECT_URI;
    this.authorizationEndpoint = process.env.FAYDA_AUTHORIZATION_ENDPOINT;
    this.tokenEndpoint = process.env.FAYDA_TOKEN_ENDPOINT;
    this.userinfoEndpoint = process.env.FAYDA_USERINFO_ENDPOINT;
    this.algorithm = process.env.FAYDA_ALGORITHM || 'RS256';
    this.clientAssertionType = process.env.FAYDA_CLIENT_ASSERTION_TYPE;
    this.expirationTime = parseInt(process.env.FAYDA_EXPIRATION_TIME) || 15;
  }

  /**
   * Generate PKCE code verifier and challenge
   * @returns {Object} Object containing code_verifier and code_challenge
   */
  generatePKCE() {
    // Generate code verifier (43-128 characters)
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    
    // Generate code challenge using SHA256
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    return {
      code_verifier: codeVerifier,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    };
  }

  /**
   * Convert JWK to PEM format manually
   * @param {Object} jwk - JSON Web Key object
   * @returns {string} PEM formatted private key
   */
  jwkToPem(jwk) {
    console.log(' Converting JWK to PEM using Node.js crypto...');
    
    try {
      // Create a KeyObject from the JWK
      const keyObject = crypto.createPrivateKey({ key: jwk, format: 'jwk' });
      
      // Export as PEM
      const pemKey = keyObject.export({ type: 'pkcs8', format: 'pem' });
      
      console.log(' Successfully converted JWK to PEM using crypto.createPrivateKey');
      return pemKey;
    } catch (error) {
      console.error(' Crypto conversion failed:', error.message);
      throw new Error(`JWK to PEM conversion failed: ${error.message}`);
    }
  }

  /**
   * Create client assertion JWT for authentication (per VeriFayda 2.0 documentation)
   * @returns {Promise<string>} Signed JWT client assertion
   */
  async createClientAssertion() {
    try {
      const CLIENT_ID = this.clientId;          // Your eSignet Client ID
      const TOKEN_ENDPOINT = this.tokenEndpoint; // Token endpoint URL (audience for JWT)
      const PRIVATE_KEY_BASE64 = process.env.FAYDA_PRIVATE_KEY; // Base64-encoded JWK private key

      console.log('🔑 Creating client assertion per Fayda documentation...');
      console.log('Client ID:', CLIENT_ID);
      console.log('Token Endpoint:', TOKEN_ENDPOINT);
      console.log('Private Key Available:', !!PRIVATE_KEY_BASE64);

      if (!PRIVATE_KEY_BASE64) {
        throw new Error('FAYDA_PRIVATE_KEY not found in environment variables');
      }

      // Step 1: Decode the Base64-encoded JWK string to JSON
      const jwkJson = Buffer.from(PRIVATE_KEY_BASE64, 'base64').toString('utf8');
      console.log('✅ Base64 JWK decoded to JSON');

      // Step 2: Parse the JSON string to get the JWK object
      const jwk = JSON.parse(jwkJson);
      console.log('✅ JWK parsed successfully, kty:', jwk.kty);

      // Step 3: Import the JWK as a usable private key for signing
      const privateKey = await importJWK(jwk, 'RS256');
      console.log('✅ JWK imported as private key for RS256 signing');

      // Step 4: Define the JWT header and payload
      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = {
        iss: CLIENT_ID,       // Issuer is the client ID
        sub: CLIENT_ID,       // Subject is the client ID
        aud: TOKEN_ENDPOINT   // Audience is the token endpoint URL
      };

      console.log('✅ JWT payload created:', payload);

      // Step 5: Create and sign the JWT
      const signedJwt = await new SignJWT(payload)
        .setProtectedHeader(header)
        .setIssuedAt()                    // Automatically sets 'iat' to current time
        .setExpirationTime('2h')          // Set expiration to 2 hours
        .sign(privateKey);                // Sign with the private key

      console.log('✅ Client assertion JWT signed successfully');
      
      // Validate the JWT by decoding it (for debugging)
      try {
        const decodedAssertion = jwt.decode(signedJwt, { complete: true });
        console.log('🔍 Client assertion validation:');
        console.log('  - Algorithm:', decodedAssertion.header.alg);
        console.log('  - Issuer (iss):', decodedAssertion.payload.iss);
        console.log('  - Subject (sub):', decodedAssertion.payload.sub);
        console.log('  - Audience (aud):', decodedAssertion.payload.aud);
        console.log('  - Issued at (iat):', new Date(decodedAssertion.payload.iat * 1000).toISOString());
        console.log('  - Expires at (exp):', new Date(decodedAssertion.payload.exp * 1000).toISOString());
        console.log('  - Current time:', new Date().toISOString());
        console.log('  - Time until expiry (minutes):', Math.round((decodedAssertion.payload.exp * 1000 - Date.now()) / 60000));
        
        // Validate expiry
        if (decodedAssertion.payload.exp * 1000 <= Date.now()) {
          console.error('❌ Client assertion has expired!');
        } else {
          console.log('✅ Client assertion is not expired');
        }
        
        // Validate required claims
        const requiredClaims = ['iss', 'sub', 'aud', 'iat', 'exp'];
        const missingClaims = requiredClaims.filter(claim => !decodedAssertion.payload[claim]);
        if (missingClaims.length > 0) {
          console.error('❌ Missing required claims:', missingClaims);
        } else {
          console.log('✅ All required claims present');
        }
      } catch (validationError) {
        console.error('❌ Failed to validate client assertion:', validationError.message);
      }
      
      return signedJwt;
    } catch (error) {
      console.error('❌ Client assertion creation failed:', error.message);
      throw new Error(`Failed to create client assertion: ${error.message}`);
    }
  }

  /**
   * Generate authorization URL for Fayda OAuth flow with PKCE
   * @param {string} state - Random state parameter for security
   * @param {string} nonce - Random nonce for ID token validation
   * @param {Object} pkce - PKCE parameters (code_challenge, code_challenge_method)
   * @returns {string} Authorization URL
   */
  generateAuthorizationUrl(state, nonce, pkce) {
    // Define claims exactly as per VeriFayda 2.0 documentation
    const claims = {
      userinfo: {
        name: { essential: true },
        phone_number: { essential: true },
        email: { essential: true },
        picture: { essential: true },
        gender: { essential: true },
        birthdate: { essential: true },
        address: { essential: true }
      },
      id_token: {}
    };

    // Build URL parameters exactly as documented (client assertion only for token exchange)
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'openid profile email userinfo',
      state: state || uuidv4(),
      code_challenge: pkce.code_challenge,
      code_challenge_method: pkce.code_challenge_method,
      claims_locales: 'en am',
      claims: JSON.stringify(claims)
    });

    const authUrl = `${this.authorizationEndpoint}?${params.toString()}`;
    
    // Debug: Log the authorization URL components
    console.log('🔍 Authorization URL components:');
    console.log('  - Base URL:', this.authorizationEndpoint);
    console.log('  - Scope parameter:', params.get('scope'));
    console.log('  - Full params:', params.toString());
    console.log('  - Complete URL (first 200 chars):', authUrl.substring(0, 200) + '...');
    console.log('  - FULL COMPLETE URL:', authUrl);
    
    // Debug logging for OAuth parameters
    console.log(' OAuth Authorization Parameters:');
    console.log('Client ID:', this.clientId);
    console.log('Redirect URI:', this.redirectUri);
    console.log('Authorization Endpoint:', this.authorizationEndpoint);
    console.log('PKCE Challenge:', pkce.code_challenge);
    console.log('State:', state);
    console.log('Full Auth URL Length:', authUrl.length);
    console.log('Auth URL Preview:', authUrl.substring(0, 200) + '...');
    
    return authUrl;
  }

  /**
   * Exchange authorization code for access token with PKCE
   * @param {string} authorizationCode - Authorization code from callback
   * @param {string} codeVerifier - PKCE code verifier
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(authorizationCode, codeVerifier) {
    try {
      const clientAssertion = await this.createClientAssertion();
      
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_assertion_type: this.clientAssertionType,
        client_assertion: clientAssertion,
        code_verifier: codeVerifier
      });

      const response = await axios.post(this.tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      console.log('✅ Token exchange successful');
      console.log('🔑 Token response keys:', Object.keys(response.data));
      console.log('🔑 Access token type:', response.data.token_type);
      console.log('🔑 Access token (first 30 chars):', response.data.access_token?.substring(0, 30) + '...');
      console.log('🔑 Token scope:', response.data.scope);
      
      // Try to decode the access token to see its contents
      try {
        const decodedToken = jwt.decode(response.data.access_token, { complete: true });
        if (decodedToken) {
          console.log('🔍 Access token header:', decodedToken.header);
          console.log('🔍 Access token payload keys:', Object.keys(decodedToken.payload));
          console.log('🔍 Access token scope from payload:', decodedToken.payload.scope);
          console.log('🔍 Access token aud:', decodedToken.payload.aud);
          console.log('🔍 Access token exp:', new Date(decodedToken.payload.exp * 1000));
        }
      } catch (decodeError) {
        console.log('🔍 Access token is not a JWT or cannot be decoded');
      }
      
      return response.data;
    } catch (error) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw new Error(`Failed to exchange code for token: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get user information from VeriFayda UserInfo endpoint (per documentation)
   * @param {string} accessToken - Access token from token exchange
   * @returns {Promise<Object>} Decoded user information
   */
  async getUserInfo(accessToken) {
    try {
      console.log('📝 Fetching user info from VeriFayda...');
      console.log('🔑 Access token (first 20 chars):', accessToken?.substring(0, 20) + '...');
      console.log('🔗 UserInfo endpoint:', this.userinfoEndpoint);
      
      const response = await axios.get(this.userinfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      console.log('✅ UserInfo response received');
      
      // According to VeriFayda 2.0 documentation, userinfo endpoint returns a JWT
      const userInfoJwt = response.data;
      
      console.log('🔑 Decoding UserInfo JWT...');
      
      // Decode the JWT without signature verification (as per documentation example)
      const decodedUserInfo = jwt.decode(userInfoJwt, { complete: false });
      
      if (!decodedUserInfo) {
        throw new Error('Failed to decode UserInfo JWT');
      }
      
      console.log('✅ UserInfo JWT decoded successfully');
      console.log('User Info Claims:', Object.keys(decodedUserInfo));
      
      // Handle multi-language claims if claims_locales was used
      const processedUserInfo = {
        sub: decodedUserInfo.sub,
        given_name: decodedUserInfo.given_name || decodedUserInfo['name#en'] || decodedUserInfo.name,
        family_name: decodedUserInfo.family_name,
        email: decodedUserInfo.email,
        phone_number: decodedUserInfo.phone_number,
        birthdate: decodedUserInfo.birthdate,
        gender: decodedUserInfo.gender,
        address: decodedUserInfo.address,
        picture: decodedUserInfo.picture,
        // Include raw decoded data
        ...decodedUserInfo
      };
      
      return processedUserInfo;
    } catch (error) {
      console.error('❌ UserInfo request failed:', error.response?.data || error.message);
      console.error('❌ UserInfo error status:', error.response?.status);
      console.error('❌ UserInfo error headers:', error.response?.headers);
      console.error('❌ Full error response:', JSON.stringify(error.response?.data, null, 2));
      
      // Log the request details for debugging
      console.error('❌ Request URL:', this.userinfoEndpoint);
      console.error('❌ Request headers:', {
        'Authorization': `Bearer ${accessToken?.substring(0, 20)}...`,
        'Accept': 'application/json'
      });
      
      throw new Error(`Failed to get user info: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Verify user identity and complete KYC process with PKCE
   * @param {string} authorizationCode - Authorization code from callback
   * @param {string} codeVerifier - PKCE code verifier
   * @returns {Promise<Object>} Complete user verification data
   */
  async verifyUserIdentity(authorizationCode, codeVerifier) {
    try {
      // Step 1: Exchange code for token using PKCE
      const tokenData = await this.exchangeCodeForToken(authorizationCode, codeVerifier);
      
      // Step 2: Get user information using access token (per VeriFayda 2.0 documentation)
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
   * @returns {Object} Test credentials including FIN, OTP, and auth URL
   */
  generateTestCredentials() {
    const testFin = '614079852391519';
    const testOtp = '111111';
    
    // Generate test PKCE for demo URL
    const testPkce = this.generatePKCE();
    
    return {
      testFin,
      testOtp,
      authUrl: this.generateAuthorizationUrl('test-state', 'test-nonce', testPkce),
      clientId: this.clientId,
      redirectUri: this.redirectUri
    };
  }
}

module.exports = new FaydaService();