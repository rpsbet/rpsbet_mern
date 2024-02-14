import React, { useEffect, useState } from 'react';
import IconButton from '@material-ui/core/IconButton';
import { ContactSupport, Close } from '@material-ui/icons';

const SupportButton = () => {
  const [intercomOpen, setIntercomOpen] = useState(false);

  useEffect(() => {
    // Set your Intercom App ID
    const APP_ID = "idcus2me";

    window.intercomSettings = {
      app_id: APP_ID,
      custom_launcher_selector: '#support-btn', // specify your support button selector
      alignment: 'right', // Adjust alignment as per your design
      horizontal_padding: 120,
      vertical_padding: 40,
      background_color: 'rgb(228 34 250)', // Change the background color
    };

    // Load Intercom script
    (function () {
      var w = window;
      var ic = w.Intercom;
      if (typeof ic === "function") {
        ic('reattach_activator');
        ic('update', w.intercomSettings);
      } else {
        var d = document;
        var i = function () { i.c(arguments); };
        i.q = [];
        i.c = function (args) { i.q.push(args); };
        w.Intercom = i;
        var l = function () {
          var s = d.createElement('script');
          s.type = 'text/javascript';
          s.async = true;
          s.src = 'https://widget.intercom.io/widget/' + APP_ID;
          var x = d.getElementsByTagName('script')[0];
          x.parentNode.insertBefore(s, x);
        };
        if (document.readyState === 'complete') {
          l();
        } else if (w.attachEvent) {
          w.attachEvent('onload', l);
        } else {
          w.addEventListener('load', l, false);
        }
      }
    })();
  }, []);

  // Function to toggle Intercom messenger
  const toggleIntercom = () => {
    setIntercomOpen(prevOpen => !prevOpen);
    if (!intercomOpen) {
      window.Intercom('show');
    } else {
      window.Intercom('hide');
    }
  };



  return (
    <IconButton
      id="support-btn"
      color="white"
      onClick={toggleIntercom}
    >
      {intercomOpen ? <Close /> : <ContactSupport />}
    </IconButton>
  );
};

export default SupportButton;
