import style from '../../Style/AuthStyle/TokenExpiredAlert.module.css';
import { Link } from 'react-router-dom';
import { useRef } from 'react';


function ShowAlert({ handleAlert }) {
    return (
        <div className={style['alert-container']}>
            <div className={style['container'] + ' ' + style['expired-alert']}>
                <div className={style['row']}>
                    <div className={style['col-lg-12']}>
                        <div className={style['alert-mess']}>
                            <p>Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.</p>
                        </div>
                    </div>
                </div>
                <div className={style['row']}>
                    <div className={style['col-lg-6']}>
                        <div className={style['alert-btn-exit']}>
                            <Link to="/" className={style["exit-btn"]} onClick={handleAlert}>Đăng xuất</Link>
                        </div>
                    </div>
                    <div className={style['col-lg-6']}>
                        <div className={style['alert-btn-login']}>
                            <Link to="/login" className={style["login-btn"]} onClick={handleAlert}>Đăng Nhập</Link>
                        </div>
                    </div>  
                </div>
            </div>
        </div>
    )
}
export {ShowAlert}