import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

/* Context Providers */
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';

/* Pages */
import Login from './pages/Login';
import Chat from './pages/Chat';
import { ProtectedRoute } from './components/ProtectedRoute';

setupIonicReact({
  mode: 'ios' // Use iOS design on all platforms for consistency
});

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <ToastProvider>
        <SocketProvider>
          <IonReactRouter>
            <IonRouterOutlet>
              <Route exact path="/login">
                <Login />
              </Route>
              <Route exact path="/chat">
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              </Route>
              <Route exact path="/">
                <Redirect to="/chat" />
              </Route>
            </IonRouterOutlet>
          </IonReactRouter>
        </SocketProvider>
      </ToastProvider>
    </AuthProvider>
  </IonApp>
);

export default App;