import React from "react";
import ReactDOM from "react-dom";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import detector from "i18next-browser-languagedetector";
import de from "./resources/localization/de.json";
import en from "./resources/localization/en.json";
import { LanguageHelper } from "./utils/helpers/languageHelper";
import { Router, Switch, Route } from "react-router-dom";
import { configure } from "mobx";
import { syncHistoryWithStore } from "mobx-react-router";
import { createHashHistory } from "history";
import routingStore from "./stores/routing.store";
import App from "./components/app";
import './main.css';
import userStore from "./stores/user.store";
import appStore from "./stores/app.store";
import GitAuth from "./components/modules/gitauth/main.component"

const bootstrap = async () => {
  await i18n.use(detector).use(initReactI18next).init({
    fallbackLng: LanguageHelper.defaultLanguage,
    keySeparator: false,
    nsSeparator: false,
    resources: {
      en: {
        translation: en,
      },
      de: {
        translation: de,
      },
    },
  });

  configure({ enforceActions: "observed" });
  const browserHistory = createHashHistory() as any;
  const history = syncHistoryWithStore(browserHistory, routingStore);
  await userStore.initialize();
  var qs = require('qs');
  var c1 = qs.parse(window.location.search, { ignoreQueryPrefix: true }).code;
  if(c1 != undefined){
    appStore.setCode(c1);
  }
  if(userStore.email != '' && userStore.stayLoggedIn == true){
    appStore.setIsLoggedIn(true);
    routingStore.history.push("/");
  
  }else if(appStore.code == ""){
    history.push("/login");
  }

  ReactDOM.render(
      <React.StrictMode>
     
        <Router history={history}>
          <App/>
        </Router>
      </React.StrictMode>,
    document.getElementById("root")
  );
};

bootstrap();
