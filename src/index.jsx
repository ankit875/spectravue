import { Preloader } from '@/components/common';
import 'normalize.css/normalize.css';
import React from 'react';
import { render } from 'react-dom';
import 'react-phone-input-2/lib/style.css';
import { onAuthStateFail, onAuthStateSuccess } from '@/redux/actions/authActions';
import configureStore from '@/redux/store/store';
import '@/styles/style.scss';
import WebFont from 'webfontloader';
import App from './App';
import firebase from '@/services/firebase';

WebFont.load({
  google: {
    families: ['Tajawal']
  }
});

const { store, persistor } = configureStore();
const root = document.getElementById('app');

// Render the preloader on initial load
render(<Preloader />, root);

// Handle auth state changes for both Firebase and dummy mode
const handleAuthStateChange = (user) => {
  if (user) {
    store.dispatch(onAuthStateSuccess(user));
  } else {
    store.dispatch(onAuthStateFail('Failed to authenticate'));
  }
  // then render the app after checking the auth state
  render(<App store={store} persistor={persistor} />, root);
};

// Check if Firebase auth is available or if we're in dummy mode
if (firebase.auth && typeof firebase.auth.onAuthStateChanged === 'function') {
  // Real Firebase mode
  firebase.auth.onAuthStateChanged(handleAuthStateChange);
} else {
  // Dummy mode - set up auth state handler and render app
  firebase.setAuthStateChangeHandler(handleAuthStateChange);
  setTimeout(() => {
    handleAuthStateChange(null); // Start with no user
  }, 100);
}

// Service worker temporarily disabled
// if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js').then((registration) => {
//       console.log('SW registered: ', registration);
//     }).catch((registrationError) => {
//       console.log('SW registration failed: ', registrationError);
//     });
//   });
// }
