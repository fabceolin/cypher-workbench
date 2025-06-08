import React, { useState } from "react";
import { printDebug } from "../../App";
import { doRedirect } from "../../auth/history";
import auth from "../../auth/localAuth";
import MuiAlert from "@material-ui/lab/Alert";
import { Button, TextField, Snackbar } from "@material-ui/core";
import { encryptV1 } from '../encryption';
import { getDynamicConfigValue } from '../../dynamicConfig';

import Wrapper from "../Wrapper";

const Email = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const validateEmail = (email) => {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleContinue = async () => {
    try {
      console.log("Login attempt for user:", email);
      
      if (!email || !password) {
        var message = 'Please fill out all fields';
        if (!email) {
          message = "Please enter a valid email or username";
        } else if (!password) {
          message = "Password cannot be blank";
        } 
        setSnackbarMessage(message);
        setSnackbarOpen(true);
        return;
      }
      
      // Special handling for admin user
      const isAdminUser = email.toLowerCase() === 'admin';
      if (isAdminUser) {
        console.log("Admin user detected - streamlining login");
      }
      
      const response = await auth.createUser(email, password);
      console.log("Authentication response received", response.error ? "with error" : "success");
      if (!response.error) {
        // Check if user needs to accept EULA
        const needsEula = (getDynamicConfigValue("REACT_APP_EULA") === 'eula') && !isAdminUser;
        if (needsEula) {
          const acceptedEula = await auth.acceptedEula(email);
          console.log("EULA acceptance check result:", acceptedEula);
          if (acceptedEula) {
            // User has accepted EULA, proceed to homepage
            console.log("User has accepted EULA, redirecting to homepage");
            auth.setAcceptedEula(true);
            localStorage.setItem("accepted_eula", "true");
            doRedirect("/", "Email: acceptedEula is true");
          } else {
            console.log("Redirecting to EULA acceptance page");
            const payload = JSON.stringify({ ex: email, px: encryptV1(password)});
            const encryptedPayload = encryptV1(payload);
            const encoded = encodeURIComponent(encryptedPayload);
            doRedirect(`/eula/${encoded}`, "Email: acceptedEula is false");
          }
        } else {
          // Admin users or environments without EULA requirements
          console.log("EULA not required, proceeding to login");
          auth.setAcceptedEula(true);
          localStorage.setItem("accepted_eula", "true");
          
          // Explicitly set the session again to ensure token is properly stored
          if (response.user && response.user.email) {
            const token = response.user.localAuthToken ? response.user.localAuthToken.token : '';
            auth.setSession(response.user.email, token);
          }
          
          // Use setTimeout to avoid race conditions with browser history
          setTimeout(() => {
            doRedirect("/", "Email: direct login");
          }, 100);
        }
      } else {
        console.log('Authentication error:', response.error);
        setSnackbarMessage("Authentication failed: " + (response.error || 'Unknown error'));
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error in login process:", error);
      setSnackbarMessage("Login error: " + error.message);
      setSnackbarOpen(true);
    }
  };

  return (
    <Wrapper
      snackbarOpen={snackbarOpen}
      setSnackbarOpen={setSnackbarOpen}
      snackbarMessage={snackbarMessage}
    >
      <div
        style={{
          width: "350px",
          color: "#37474f",
          fontSize: "24px",
          fontFamily: "lato",
          fontWeight: "500",
        }}
      >
        Login
      </div>
      <div />
      <div style={{ height: "36px" }} />
        <TextField
          id='ds-workbench-email'
          name='ds-workbench-email'
          inputProps={{
            autocomplete: "off"
          }}
          label="email"
          variant="outlined"
          style={{ width: "350px", fontFamily: "lato", fontWeight: "400" }}
          onChange={(e) => setEmail(e.target.value)}
        />
      <div style={{ height: "24px" }} />
        <TextField
          id='ds-workbench-password'
          name='ds-workbench-password'
          inputProps={{
            autocomplete: "off"
          }}
          label="password"
          type='password'
          variant="outlined"
          style={{ width: "350px", fontFamily: "lato", fontWeight: "400" }}
          onKeyDown={(e) => { 
            if (e.key === "Enter") {
              e.preventDefault();
              handleContinue();  
            }            
          }}
          onChange={(e) => setPassword(e.target.value)}
        />
      <div style={{ height: "24px" }} />
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleContinue()}
        style={{
          height: "50px",
          width: "350px",
          fontFamily: "lato",
          fontWeight: "700",
        }}
      >
        Continue
      </Button>
    </Wrapper>
  );
};

export default Email;
