import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CompanyInviteHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1) Grab token from URL
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      return navigate("/404");
    }

    // 2) If not logged in yet, save and send to login
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      localStorage.setItem("inviteToken", token);
      return navigate("/login");
    }

    // 3) Already logged in → accept invite
    axios
      .post(
        "https://api.linknamali.ke/company/accept-invite",
        { invitation_token: token },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )
      .then(() => {
        navigate("/user-dashboard");
      })
      .catch(() => {
        navigate("/invite-expired");
      });
  }, [navigate]);

  return <p>Loading invitation…</p>;
};

export default CompanyInviteHandler;
