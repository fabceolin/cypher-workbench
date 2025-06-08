import React, { useState } from "react";
import auth from "../../auth/localAuth";
import { doRedirect } from "../../auth/history";
import { Button, Radio, Snackbar } from "@material-ui/core";
import Wrapper from "../Wrapper";
import { decryptV1 } from "../encryption";

const decipherPayload = (payload) => {
  if (payload) {
    try {
      const decoded = decodeURIComponent(payload);
      const jsonString = decryptV1(decoded);
      return JSON.parse(jsonString);
    } catch (e) {
      console.log(`Error deciphering payload ${payload}`);
      console.log(e);
    }
  }
  return {
    ex: '',
    px: ''
  }
}

const Eula = (props) => {
  const emailpayload = props.match.params.emailpayload;
  const { ex, px } = decipherPayload(emailpayload);
  const email = ex;
  //auth.setSession(email);
  auth.setAcceptedEula(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [agreedToLicense, setAgreedToLicense] = useState(false);
  const licenseEulaFile = localStorage.getItem("licenseEulaFile");

  const handleLogIn = async () => {
    if (!agreedToLicense) {
      setSnackbarOpen(true);
      return;
    }
    
    try {
      console.log("EULA accepted, proceeding with login for user:", email);
      localStorage.removeItem("licenseEulaFile");
      
      // Mark EULA as accepted first
      auth.setAcceptedEula(true);
      localStorage.setItem("accepted_eula", "true");
      
      // Get existing token from localStorage if available
      const idToken = localStorage.getItem("id_token");
      if (idToken) {
        console.log("Token already exists, using it for login");
        const token = auth.getLocalAuthTokenFromIdToken(idToken);
        
        // Ensure session is properly set
        auth.setSession(email, token);
        
        // Redirect with slight delay to avoid race conditions
        setTimeout(() => {
          doRedirect("/", "Eula: accepted with existing token");
        }, 50);
        return;
      }
      
      // No existing token, perform login
      console.log("No existing token, performing login");
      await auth.login(email, px);
      
      // Additional safeguard: verify we have a token after login
      const newIdToken = localStorage.getItem("id_token");
      if (!newIdToken) {
        console.warn("Login succeeded but no token was set. Setting session manually.");
        // Try to manually set session one more time
        auth.setSession(email, ""); // Even with empty token, at least set the email
      }
      
      // No need to redirect - auth.login already includes redirect logic
    } catch (error) {
      console.error("Error in EULA acceptance/login process:", error);
      alert("Error during login after EULA acceptance. Please try again.");
    }
  };

  return (
    <Wrapper
      snackbarOpen={snackbarOpen}
      setSnackbarOpen={setSnackbarOpen}
      snackbarMessage={"Oops! You need to accept the license agreement."}
    >
      <div
        style={{
          width: "550px",
          color: "#37474f",
          fontSize: "24px",
          fontFamily: "lato",
          fontWeight: "500",
        }}
      >
        License Agreement
      </div>
      <div style={{ height: "24px" }} />
      <embed
        style={{
          height: "350px",
          width: "550px",
          overflowY: "scroll",
          border: "1px solid #cfd8dc",
          padding: "24px"
        }}
        src={`${process.env.PUBLIC_URL}/${licenseEulaFile}`}
      >
      </embed>
      <div style={{ height: "12px" }} />
      <div style={{ width: "550px", display: "flex", alignItems: "center" }}>
        <Radio
          checked={agreedToLicense}
          onClick={() => setAgreedToLicense(!agreedToLicense)}
          style={{ color: "#2E8CC1" }}
        />
        <div
          style={{ fontFamily: "lato", fontWeight: "300", fontSize: "14px" }}
        >
          I agree to the terms and conditions in the above license agreement
          {/*}<a style={{ cursor: "pointer", textDecoration: "underline" }}>here</a>*/}
        </div>
      </div>
      <div style={{ height: "24px" }} />
      <div
        style={{
          width: "550px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Button
          variant="contained"
          color="default"
          onClick={() => doRedirect("/login", "Eula: decline button")}
          style={{
            height: "50px",
            width: "270px",
            fontFamily: "lato",
            fontWeight: "700",
          }}
        >
          Decline
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleLogIn()}
          style={{
            height: "50px",
            width: "270px",
            fontFamily: "lato",
            fontWeight: "700",
          }}
        >
          Accept
        </Button>
      </div>
    </Wrapper>
  );
};

export default Eula;
