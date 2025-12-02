// src/Components/forgotPassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import style from'../../Style/AuthStyle/ForgotPassword.module.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const navigate = useNavigate();

    const handleChangeEmail=(e)=>{
        setError('');
        setInfo('');
        setEmail(e.target.value)
    }

    const handleResetSubmit = async (event) => {
        event.preventDefault();
        setInfo('Chức năng đặt lại mật khẩu hiện không yêu cầu mã OTP và sẽ sớm được cập nhật. Vui lòng liên hệ quản trị viên để được hỗ trợ đổi mật khẩu.');
    };

    return (
        <div className={style["forgot-password-container"]}>
        <div className={style["forgot-password-box"]}>
            <h2>Quên mật khẩu</h2>
                <form class={style["forgot-form"]} onSubmit={handleResetSubmit}>
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Nhập email"
                    required
                    value={email}
                    onChange={handleChangeEmail}
                />
                    {error && <p className={style["error-message"]}>{error}</p>}
                    {info && (
                        <p className={style["error-message"]} style={{ color: "#0a8754" }}>
                            {info}
                        </p>
                    )}
                <div className={style['btn-container']}>
                    <button type="submit" className={style["reset-btn"]}>
                    Đặt lại mật khẩu
                    </button>
                </div>
                
            </form>
            <button
                type="button"
                onClick={() => navigate('/login')}
                className={style["login-btn"]}
            >
                Trở lại Đăng nhập
                </button>
        </div>
    </div>
    );
}

export default ForgotPassword;
