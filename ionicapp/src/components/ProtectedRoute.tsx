import React from 'react';
import { Redirect } from 'react-router-dom';
import { IonSpinner, IonContent, IonPage } from '@ionic/react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <IonPage>
        <IonContent className="gradient-background">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <IonSpinner name="crescent" color="light" />
            <p style={{ color: 'white', fontSize: '1.1rem' }}>Loading...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
};