import React from "react";
import style from "./../Style/ModalGeneral.module.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

export const ModalGeneral = ({ isOpen, text, type, onClose, onConfirm }) => {
    if (!isOpen) return null;

    // Xác định icon và màu sắc dựa trên loại modal
    const getModalStyle = () => {
        switch (type) {
            case "success":
                return { icon: <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} />, color: "green" };
            case "error":
                return { icon: "❌", color: "red" };
            case "confirm":
                return { icon: "❓", color: "blue" };
            default:
                return { icon: "", color: "black" };
        }
    };

    const { icon, color } = getModalStyle();

    return (
        <div className={style["modal-overlay"]}>
            <div className={style["modal-content"]}>
                <button className={style["modal-close-button"]} onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                 </button>
                 <div className={`${style["modal-header"]} ${style[type]}`}>
                    <span className={style["modal-icon"]}>{icon}</span>
                    <p>{text}</p>
                </div>
                <div className={style["modal-buttons"]}>
                    {type === "confirm" && (
                        <button className={style["modal-confirm-button"]} onClick={onConfirm}>
                            Đồng ý
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
