import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import style from '../../Style/AuthStyle/ResetPassword.module.css'; // CSS module import
import { refreshToken, forgotPassword, resetPassword } from '../../API/authAPI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { ModalGeneral } from '../ModalGeneral';

function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [modal, setModal] = useState({
        isOpen: false,
        text: "",
        type: "", // "confirm" hoặc "success"
        onConfirm: null, // Hàm được gọi khi xác nhận
      });

    const { email, token } = location.state || {};

    const handlePasswordChange = (e) => {
        setError(null);
        const inputPassword = e.target.value;
        setPassword(inputPassword)
    };

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
        setError(null);
    };

    const handleCloseModal = () => {
        setModal({ isOpen: false }); // Đóng modal
        navigate('/login'); // Điều hướng
    };
    const handleResetPassword = async () => {
        if (isSubmitting) return;

        // Basic validation
        if (!email || !token) {
            setError({ message: 'Thông tin không hợp lệ. Vui lòng thử lại.' });
            navigate('/forgot-password');
            return;
        }
        if (password.trim() === '') {
            setError({ message: 'Mật khẩu không được để trống.' });
            return;
        }
        if (password !== confirmPassword) {
            setError({ message: 'Mật khẩu và mật khẩu xác nhận không khớp.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const resetData = { email, password };
            await resetPassword(resetData, token);
            setModal({
                isOpen: true,
                text: "Mật khẩu đã được đặt lại thành công!",
                type: "success",
                onConfirm: handleCloseModal
              });
        } catch (err) {
            setError('Mật Khẩu Không hợp lệ');
        }
        finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={style['reset-password-container']}>
            <h2>Đặt Lại Mật Khẩu</h2>

            {error && <p className={style['error-message']}>{error.message}</p>}

            <label htmlFor="new-password">Mật khẩu mới</label>
            <div className={style['password-input-container']}>
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới"
                    value={password}
                    onChange={handlePasswordChange}
                    className={style['password-input']}
                />
                <span
                    className={style['password-toggle-icon']}
                    onClick={() => setShowPassword(!showPassword)}
                >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </span>
            </div>

            <label htmlFor="confirm-new-password">Xác nhận mật khẩu mới</label>
            <div className={style['password-input-container']}>
                <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={style['password-input']}
                />
                <span
                    className={style['password-toggle-icon']}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                </span>
            </div>

            {successMessage && <p className={style['success-message']}>{successMessage}</p>}

            <button
                type="button"
                onClick={handleResetPassword}
                className={style['reset-password-button']}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
            </button>
            {modal.isOpen && (
                <ModalGeneral 
                    isOpen={modal.isOpen} 
                    text={modal.text} 
                    type={modal.type} 
                    onClose={modal.onConfirm || (() => setModal({ isOpen: false }))}
                    onConfirm={modal.onConfirm}
                />
            )}
        </div>
    );
}

export default ResetPassword;
