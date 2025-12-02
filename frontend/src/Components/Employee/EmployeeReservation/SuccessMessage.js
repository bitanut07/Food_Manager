import React, { useEffect, useState } from "react";
import { useAuth } from "../../Auth/AuthContext";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import style from "./SuccessMessage.module.css";
import QRCodeGenerator from "../../Customer/QRReview";
import { fetchPromotionByCode, fetchPromotions } from "../../../API/PromotionAPI";
import { markPaid } from "../../../API/EE_ReservationAPI";
import { FaCheck } from 'react-icons/fa';


function SuccessMessage({ setShow, setShowExInvoice, setShowInvoice}) {
    const closeAll = () => {
        setShow(false);
        setShowInvoice(false);
        setShowExInvoice(false);
    }

    return (
        <div className={style['ctn']}>
            <div className={style['container']}>
                <div className={style['export-invoice-ctn']}>
                    <div className={style['row']}>
                        <div className={style['col-lg-12']}>
                            <div className={style['close-ctn']}>
                                <button className={style["close-modal"]} onClick={() => closeAll()}>
                                    &times;
                                </button>
                            </div>
                            <div className={style['title']}>
                                <FaCheck color='green' size={40}></FaCheck>
                                <h2>Thanh toán hoàn tất</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SuccessMessage