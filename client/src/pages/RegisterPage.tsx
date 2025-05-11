import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        if (!username || !email || !password || !displayName) {
            setError('所有字段均为必填项');
            setLoading(false);
            return;
        }
        // TODO: 可以添加更复杂的密码校验，例如两次输入密码是否一致

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, displayName }),
            });

            const data = await response.json();

            if (response.ok) {
                // 注册成功
                console.log('注册成功:', data);
                setSuccessMessage(data.message || '注册成功！现在您可以去登录了。');
                // 清空表单
                setUsername('');
                setEmail('');
                setPassword('');
                setDisplayName('');
                // TODO: 考虑重定向到登录页面或显示更友好的成功提示
                // alert('注册成功！请前往登录页面。');
            } else {
                // 注册失败
                setError(data.message || '注册失败，请检查您输入的信息。');
            }
        } catch (err) {
            console.error('注册请求失败:', err);
            setError('发生网络错误，请稍后再试。');
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>注册</h2>
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>用户名:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>邮箱:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="displayName" style={{ display: 'block', marginBottom: '5px' }}>显示名称:</label>
                    <input
                        type="text"
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>密码:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                {/* TODO: 添加确认密码字段 */}
                <button type="submit" disabled={loading} style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                    {loading ? '注册中...' : '注册'}
                </button>
            </form>
            <p style={{ marginTop: '15px', textAlign: 'center' }}>
                已经有账户了? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>立即登录</Link>
            </p>
        </div>
    );
};

export default RegisterPage; 