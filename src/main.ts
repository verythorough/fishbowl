import './styles/main.css';
import { initScreenManager } from './screens/ScreenManager';

// Initialize the app
const appContainer = document.getElementById('app');

if (!appContainer) {
  throw new Error('App container not found');
}

// Initialize screen manager and show welcome screen
const screenManager = initScreenManager(appContainer);
screenManager.init();
