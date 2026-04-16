import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../services/api';
import Avatar from '../common/Avatar';
import './UserProfile.css';

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

export default function UserProfile({ onClose }) {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(null); // 'name' | 'about'
  const [values, setValues] = useState({ full_name: user?.full_name, about: user?.about || '' });
  const [saving, setSaving] = useState(false);

  const save = async (field) => {
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile({ [field]: values[field] });
      updateUser(updated);
      setEditing(null);
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="user-profile">
      <div className="profile-header">
        <button onClick={onClose} className="back-btn-sm"><BackIcon /></button>
        <h3>Profile</h3>
      </div>

      <div className="profile-avatar-section">
        <div className="profile-avatar-wrap">
          <Avatar name={user?.full_name} src={user?.avatar_url} size={100} />
          <div className="profile-avatar-overlay">
            <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
              <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4zm0-8.4a5.2 5.2 0 110 10.4A5.2 5.2 0 0112 6.8zM1 6h22v14a1 1 0 01-1 1H2a1 1 0 01-1-1V6zm3-4h2l1 2h10l1-2h2a1 1 0 011 1v1H3V3a1 1 0 011-1z"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="profile-fields">
        <div className="profile-section-label">YOUR NAME</div>
        <div className="profile-field">
          {editing === 'name' ? (
            <div className="profile-edit">
              <input
                autoFocus
                value={values.full_name}
                onChange={(e) => setValues({ ...values, full_name: e.target.value })}
                maxLength={100}
              />
              <div className="profile-edit-actions">
                <button onClick={() => setEditing(null)} className="profile-cancel">Cancel</button>
                <button onClick={() => save('full_name')} disabled={saving} className="profile-save">
                  {saving ? '...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-field-display">
              <span>{user?.full_name}</span>
              <button onClick={() => setEditing('name')}><EditIcon /></button>
            </div>
          )}
          <p className="profile-field-hint">
            This is not your username. This name will be visible to your contacts.
          </p>
        </div>

        <div className="profile-section-label">ABOUT</div>
        <div className="profile-field">
          {editing === 'about' ? (
            <div className="profile-edit">
              <input
                autoFocus
                value={values.about}
                onChange={(e) => setValues({ ...values, about: e.target.value })}
                maxLength={139}
              />
              <div className="profile-edit-actions">
                <button onClick={() => setEditing(null)} className="profile-cancel">Cancel</button>
                <button onClick={() => save('about')} disabled={saving} className="profile-save">
                  {saving ? '...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-field-display">
              <span>{user?.about || 'Hey there! I am using WhatsApp Clone.'}</span>
              <button onClick={() => setEditing('about')}><EditIcon /></button>
            </div>
          )}
        </div>

        <div className="profile-section-label">ACCOUNT</div>
        <div className="profile-field">
          <div className="profile-field-display no-edit">
            <div>
              <div style={{ fontSize: 15, color: 'var(--wa-text-primary)' }}>{user?.email}</div>
              <div style={{ fontSize: 12, color: 'var(--wa-text-secondary)', marginTop: 2 }}>Email</div>
            </div>
          </div>
        </div>
        {user?.phone && (
          <div className="profile-field">
            <div className="profile-field-display no-edit">
              <div>
                <div style={{ fontSize: 15, color: 'var(--wa-text-primary)' }}>{user.phone}</div>
                <div style={{ fontSize: 12, color: 'var(--wa-text-secondary)', marginTop: 2 }}>Phone</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
