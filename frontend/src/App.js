import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    );
  return (
    <Route
      {...rest}
      render={(props) =>
        user ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

const PublicRoute = ({ component: Component, ...rest }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Route
      {...rest}
      render={(props) =>
        !user ? <Component {...props} /> : <Redirect to="/" />
      }
    />
  );
};

const AppRoutes = () => (
  <Switch>
    <PublicRoute exact path="/login" component={LoginPage} />
    <PublicRoute exact path="/register" component={RegisterPage} />
    <PrivateRoute
      exact
      path="/"
      component={() => (
        <ChatProvider>
          <ChatPage />
        </ChatProvider>
      )}
    />
    <Redirect to="/" />
  </Switch>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
