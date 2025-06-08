import { doRedirect } from "./history";
import { EULA_NAME } from "../common/LicensedFeatures";
import { getDynamicConfigValue } from '../dynamicConfig';
import { encryptV1 } from '../common/encryption';
import { getGraqhQLConnection } from '../persistence/graphql/authGraphql';
import { gql } from "@apollo/client";

class Auth {
  constructor() {
    this.type = "local";
  }

  createUser = async (email, password) => {
    try {
      console.log("Creating user with email:", email);
      const uri = getDynamicConfigValue("REACT_APP_GRAPHQL_URI") || "GRAPHQL_URI not specified";
      console.log("Using GraphQL URI:", uri);
      
      const encryptedPassword = (password) ? encryptV1(password) : '';
      const variables = { encryptedPassword, email: email };
      console.log("GraphQL variables:", { ...variables, encryptedPassword: "[ENCRYPTED]" });
      
      var authorization = `Bearer ${this.getBearerJson(email)}`;
      console.log("Authorization header set with email:", email);
      
      // Adding email parameter to ensure it's in the context
      var graphQLConnection = getGraqhQLConnection(uri, authorization);
      
      const result = await graphQLConnection.mutate({
        mutation: gql`
          mutation createUser ($encryptedPassword: String, $email: String) {
            createUser (encryptedPassword: $encryptedPassword, email: $email) {
              error
              user {
                email
                name
                localAuthToken {
                  token
                  expires
                }
              }
            }
          }
        `,
        variables: variables
      });
      
      const { data } = result;
      const { error, user } = data.createUser;
      
      if (error) {
        console.log("Auth error: " + error);
        alert("Auth error: " + error);
        this.logout();
        return { error };
      } else if (!user || !user.email) {
        const errorMsg = "User data is incomplete or missing";
        console.log(errorMsg);
        alert(errorMsg);
        this.logout();
        return { error: errorMsg };
      } else if (!user.localAuthToken) {
        console.log("User found but localAuthToken is missing - attempting to log in directly");
        // If we have a user but no token, try to log in directly
        this.login(user.email, password);
        return { user };
      } else {
        console.log("Successful authentication with token");
        this.setSession(user.email, user.localAuthToken.token);
        return { user };
      }
    } catch (error) {
      console.log("Auth error: " + error);
      alert("Auth error: " + error);
      this.logout();
      return { error };
    }
  }

  getIdentityInfo = () => {
    var { primaryOrganization } = JSON.parse(localStorage.getItem("user") || '{}');
    var { email, sub } = JSON.parse(localStorage.getItem("id_token_payload") || '{}');
    email = email || '';
    sub = sub || '';
    primaryOrganization = primaryOrganization || '';

    return { email, sub, org: primaryOrganization }
  }

  getIdToken = () => {
    return localStorage.getItem("id_token");
  };

  getLoggedInUserInfo = () => {
    return { email: this.getEmailFromIdToken(localStorage.getItem("id_token")) };
  };

  login = async (email, encryptedPassword) => {
    try {
      console.log("Login function called for user:", email);
      const uri = getDynamicConfigValue("REACT_APP_GRAPHQL_URI");
      const variables = { email, encryptedPassword };
      var authorization = `Bearer ${this.getBearerJson(email)}`;
      var graphQLConnection = getGraqhQLConnection(uri, authorization);
      
      // The admin login might need special handling
      const isAdminUser = email.toLowerCase() === 'admin';
      if (isAdminUser) {
        console.log("Admin user login detected");
      }
      
      console.log("Executing login mutation...");
      const result = await graphQLConnection.mutate({
        mutation: gql`mutation LogInLocalUser ($email: String, $encryptedPassword: String) {
          localUser: logInLocalUser (email: $email, encryptedPassword: $encryptedPassword) {
            email
            localAuthToken {
              token
              expires
            }
          }
        }
        `,
        variables: variables
      });
      
      console.log("Login mutation completed", result);
      
      if (result.data && result.data.localUser && result.data.localUser.email) {
        console.log("User authenticated successfully");
        
        // Extract token from result if available
        let token = '';
        if (result.data.localUser.localAuthToken && result.data.localUser.localAuthToken.token) {
          token = result.data.localUser.localAuthToken.token;
          console.log("Token received from server");
        } else {
          console.log("No token in response, using empty token");
        }
        
        // Set the session with the extracted token
        this.setSession(email, token);
        this.setAcceptedEula(true);
        
        // Use setTimeout to avoid race conditions with browser history
        console.log("Redirecting to homepage");
        setTimeout(() => {
          doRedirect("/", "localAuth: login success");
        }, 100);
        
        return true;
      } else {
        console.warn("Login response did not contain user data");
        this.logout();
        return false;
      }
    } catch (err) {
      console.error("Login error:", err);
      this.logout();
      return false;
    }
  };

  getCredentialsFromIdToken = (idToken) => {
    if (typeof(idToken) === 'string') {
      idToken = idToken || '';
      if (idToken) {
        try {
          idToken = JSON.parse(idToken);
        } catch (e) {
          console.log(`idToken: '${idToken}' is not valid JSON, ignoring`);
          idToken = null;
        }
        
      }
    }
    idToken = idToken || {};
    var credentials = idToken.credentials || '';
    if (credentials) {
      credentials = atob(credentials);      
    }
    return credentials;
  }

  getEmailFromIdToken = (idToken) => {
      const credentials = this.getCredentialsFromIdToken(idToken);
      const email = credentials.split(':')[0] || '';
      return email;
  }

  getLocalAuthTokenFromIdToken = (idToken) => {
    const credentials = this.getCredentialsFromIdToken(idToken);
    const localAuthToken = credentials.split(':')[1] || '';
    return localAuthToken;
  }

  getBearerJson = (email, localAuthToken) => {
    localAuthToken = localAuthToken || '';
    var credentials = `${email}:${localAuthToken}`;
    // using btoa because there isn't an better+easy alternative at the moment
    credentials = btoa(credentials);
    const bearerValue = { type: 'SWToken', credentials: credentials }
    const bearerValueString = JSON.stringify(bearerValue);
    return bearerValueString;
  }

  setSession = (email, localAuthToken) => {
    //console.log('localAuth: doing setItem id_token');
    //localStorage.setItem("id_token", email);
    localStorage.setItem("id_token_payload", JSON.stringify({ email }));
    const idTokenString = this.getBearerJson(email, localAuthToken);
    localStorage.setItem("id_token", idTokenString);
  };

  setAcceptedEula = (acceptedEula) => {
    localStorage.setItem("accepted_eula", acceptedEula);
  }

  logout = () => {
    //alert('removing id_token');
    localStorage.removeItem("id_token_payload");    
    localStorage.removeItem("id_token");
    //localStorage.removeItem("accepted_eula");
    doRedirect("/login", "localAuth: logout");
  };

  acceptedEula = async (email) => {
    const eulaSetting = getDynamicConfigValue("REACT_APP_EULA");
    if (eulaSetting === 'none') {
      return true;
    }

    const uri = getDynamicConfigValue("REACT_APP_GRAPHQL_URI");
    const variables = { email };
    var authorization = `Bearer ${this.getIdToken()}`;
    var graphQLConnection = getGraqhQLConnection(uri, authorization);
    try {
      const result = await graphQLConnection.query({
        query: gql`query AcceptedEula ($email: String) {
          acceptedEula (email: $email)
        }
        `,
        variables: variables
      });
      return result.data.acceptedEula;
    } catch (error) {
      console.log('Error checking EULA acceptance:', error);
      // Don't logout immediately, return false to allow better error handling
      return false;
    }
  };

  isAuthenticated = () => {
    return Boolean(localStorage.getItem("accepted_eula"));
  };

  callLogEulaAcceptance = (email) => {
    if (localStorage.getItem("accepted_eula_recorded") !== "true") {
        const uri = getDynamicConfigValue("REACT_APP_EULA_GRAPHQL_URI");
        const variables = { userEmail: email, eulaName: EULA_NAME };
        var graphQLConnection = getGraqhQLConnection(uri);
        graphQLConnection.mutate({
          mutation: gql`mutation logEulaAcceptance ($userEmail: String!, $eulaName: String!) {
            logEulaAcceptance (userEmail:$userEmail, eulaName:$eulaName) {
              name
            }
          }
          `,
          variables: variables
        })
          .then((result) => {
            if (result.data && result.data.logEulaAcceptance && result.data.logEulaAcceptance.name === EULA_NAME) {
              localStorage.setItem("accepted_eula_recorded", "true");
            } else {
              console.log("Could not record Eula acceptance, unexpected response: ", result);
            }
          })
          .catch((err) => {
            console.log("Could not record Eula acceptance", err);
            setTimeout(() => this.callLogEulaAcceptance(email), 1000*600); // call again in 10 min
          });
    }
  };
}

const auth = new Auth();

export default auth;
