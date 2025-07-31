import React, { useEffect, useState } from "react";
import { Button } from "payload/components/elements";
import { createUseStyles } from "react-jss";
import { useConfig } from "payload/components/utilities";
import { ToastContainer, toast } from "react-toastify";
const useStyles = createUseStyles({
  buttons: {
    display: "flex",
    justifyContent: "flex-end",
    "& button": {
      margin: "0 8px",
      "&:last-of-type": {
        marginRight: 0,
      },
    },
    "& .hidden": {
      display: "none",
    },
  },
});
const AdministerInstance: React.FC = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const config = useConfig();
  if (!(config && config.serverURL)) {
    return null;
  }
  const {
    routes: { api },
    serverURL,
  } = config;
  const classes = useStyles();
  useEffect(() => {
    const getUserInfo = async () => {
      const userData = await fetch(`${serverURL}${api}/users/me`).then((res) =>
        res.json()
      );
      setUserInfo(userData.user);
    };
    getUserInfo();
  }, [serverURL, api, setUserInfo]);
  const restart = async () => {
    setIsRestarting(true);
    toast.info(
      "MZinga backoffice is restarting. It will take some seconds, please wait before reloading the page...",
      {
        autoClose: false,
        hideProgressBar: true,
      }
    );
    await fetch(`${serverURL}${api}/admin/restart-instance`, {
      method: "POST",
    });
  };
  return (
    userInfo &&
    (userInfo.roles || []).includes("admin") && (
      <div className={classes.buttons}>
        <Button onClick={restart} disabled={isRestarting}>
          Restart instance
        </Button>
        <ToastContainer
          position="bottom-center"
          autoClose={10000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
        />
      </div>
    )
  );
};

export default AdministerInstance;
