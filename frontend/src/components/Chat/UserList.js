import React from 'react';

const UserList = ({ users, selectedUser, onSelectUser, currentUserId }) => {
  return (
    <div className="user-list">
      <h3>Users</h3>
      {users.map(user => (
        user.id !== currentUserId && (
          <div
            key={user.id}
            className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
            onClick={() => onSelectUser(user)}
          >
            <div className="user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div>{user.username}</div>
              <small>{user.email}</small>
            </div>
          </div>
        )
      ))}
    </div>
  );
};

export default UserList;