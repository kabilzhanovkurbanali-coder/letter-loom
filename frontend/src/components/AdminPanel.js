import React, { useCallback, useEffect, useMemo, useState } from 'react';

export function AdminPanel({ onClose, apiBaseUrl, adminToken, showToast }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);

  const adminHeaders = useMemo(
    () => ({ 'x-admin-token': adminToken || '', 'Content-Type': 'application/json' }),
    [adminToken]
  );

  const loadUsers = useCallback(async () => {
    const res = await fetch(`${apiBaseUrl}/api/users`, { headers: adminHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Нет доступа');
    setUsers(data);
  }, [apiBaseUrl, adminHeaders]);

  useEffect(() => {
    loadUsers()
      .then(() => {
        setError('');
      })
      .catch((err) => {
        console.error('Ошибка админки:', err);
        setError(err.message || 'Не удалось загрузить данные');
      });
  }, [loadUsers]);

  const handleDeleteUser = async (user) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: adminHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления');
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setUserToDelete(null);
      showToast?.(`Аккаунт ${user.username} удалён.`, 'success');
    } catch (err) {
      showToast?.(err.message || 'Не удалось удалить аккаунт', 'error');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '20px', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#ffcc00' }}>🛡️ Админ-панель</h1>
        <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '15px', border: 'none', background: '#ff4757', color: 'white', cursor: 'pointer' }}>
          ❌ Закрыть
        </button>
      </div>

      {error ? <p style={{ color: '#ff6b81' }}>Ошибка: {error}</p> : null}

      <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Пользователи</h3>
        {users.length === 0 ? (
          <p>Пока нет пользователей.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ffcc00' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Логин</th>
                <th style={{ padding: '10px' }}>Очки</th>
                <th style={{ padding: '10px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <td style={{ padding: '10px' }}>{user.id}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{user.username}</td>
                  <td style={{ padding: '10px', color: '#ffcc00', fontWeight: 'bold' }}>{user.score}</td>
                  <td style={{ padding: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setUserToDelete(user)}
                      style={{ border: 'none', borderRadius: '10px', background: '#ff4757', color: 'white', padding: '8px 12px', cursor: 'pointer' }}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {userToDelete ? (
        <div style={overlayStyle}>
          <div style={dialogStyle}>
            <h3 style={{ marginTop: 0, color: '#1e2a44' }}>Удалить аккаунт?</h3>
            <p style={{ color: '#445', lineHeight: 1.45 }}>
              Аккаунт <strong>{userToDelete.username}</strong> будет удалён без возможности восстановления.
            </p>
            <div style={dialogActionsStyle}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                style={{ ...dialogButtonStyle, background: '#dfe6ef', color: '#34495e' }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(userToDelete)}
                style={{ ...dialogButtonStyle, background: '#ff4757', color: 'white' }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(6, 18, 38, 0.45)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  zIndex: 1000
};

const dialogStyle = {
  width: '100%',
  maxWidth: '460px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(235,245,255,0.95) 100%)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.22)'
};

const dialogActionsStyle = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '18px',
  flexWrap: 'wrap'
};

const dialogButtonStyle = {
  border: 'none',
  borderRadius: '14px',
  padding: '12px 18px',
  fontWeight: 'bold',
  cursor: 'pointer'
};
