import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GetEmailCus,
  GetInfoCus,
  ChangeInfoCus,
  CheckPassword,
  ChangeInfoLogCus,
} from "../../API/FixInfoAPI";
import {
  GetEmailEmp,
  GetInfoEmp,
  ChangeInfoEmp,
  ChangeInfoLogEmp,
} from "../../API/EmployeeAPI";
import { isTokenExpired } from "../../utils/tokenHelper.mjs";
import { refreshToken } from "../../API/authAPI";
import Modal from "../Customer/Modal";
import style from "../../Style/CustomerStyle/Profile.module.css";
import { useAuth } from "./AuthContext";
import { ModalGeneral } from "../ModalGeneral";

function Profile() {
  const [personalInfo, setPersonalInfo] = useState({
    full_name: "",
    gender: "",
    phone_number: "",
    address: "",
  });
  const [originalInfo, setOriginalInfo] = useState({
    full_name: "",
    gender: "",
    phone_number: "",
    address: "",
  });
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "********",
  });
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    newEmail: "",
    confirmNewEmail: "",
  });
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [error, setError] = useState(null);
  const [Modalerror, setModalerror] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "", // "confirm" hoặc "success"
    onConfirm: null, // Hàm được gọi khi xác nhận
  });

  const navigate = useNavigate();
  const { accessToken, setAccessToken } = useAuth();
  const refresh = localStorage.getItem("refreshToken");
  const UserID = localStorage.getItem("userId");
  const account_type = localStorage.getItem("userRole");
  let email;

  const ensureActiveToken = async () => {
    if (!refresh || isTokenExpired(refresh)) {
              navigate('/', { replace: true });
              window.location.reload();
              throw 'Phiên đăng nhập hết hạn';
            }
    let activeToken = accessToken;
    if (!accessToken || isTokenExpired(accessToken)) {
      const refreshed = await refreshToken(refresh);
      activeToken = refreshed.access;
      setAccessToken(activeToken);
    }
    return activeToken;
  };

  useEffect(() => {
    const activeToken = ensureActiveToken();
    if (!activeToken || !refresh || !UserID) {
      navigate("/login");
    } else {
      fetchProfileData();
    }
  }, []);

  const fetchProfileData = async () => {
    try {
      const activeToken = await ensureActiveToken();

      let responseCusPromise, responseEmailPromise;

      if (account_type === "user") {
        responseCusPromise = GetInfoCus(UserID, activeToken);
        responseEmailPromise = GetEmailCus(UserID, activeToken);
      } else if (account_type === "employee") {
        responseCusPromise = GetInfoEmp(UserID, activeToken);
        responseEmailPromise = GetEmailEmp(UserID, activeToken);
      } else if (account_type === "admin") {
        const responseEmail = await GetEmailEmp(UserID, activeToken);
        setLoginInfo({
          email: responseEmail.email || "",
          password: "********",
        });
        email = responseEmail.email;
        return;
      }

      const [responseCus, responseEmail] = await Promise.all([
        responseCusPromise,
        responseEmailPromise,
      ]);

      setPersonalInfo({
        full_name: responseCus.full_name || "",
        gender: responseCus.gender || "",
        phone_number: responseCus.phone_number || "",
        address: account_type === "Employee" ? responseCus.address || "" : "",
      });
      setOriginalInfo({
        full_name: responseCus.full_name || "",
        gender: responseCus.gender || "",
        phone_number: responseCus.phone_number || "",
        address: account_type === "Employee" ? responseCus.address || "" : "",
      });
      setLoginInfo({ email: responseEmail.email || "", password: "********" });
      email = responseEmail.email;
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setError("Không thể tải thông tin.");
      if (error.response?.status === 401) navigate("/login");
    }
  };

  const validatePhoneNumber = (phone) => {
    if (phone.length === 0) {
      return "Số điện thoại không được để trống.";
    }
    if (!/^[0-9]+$/.test(phone)) {
      return "Số điện thoại chỉ được chứa chữ số.";
    }
    if (phone.length !== 10) {
      return "Số điện thoại phải đủ 10 chữ số.";
    }
    if (!/^03/.test(phone)) {
      return "Số điện thoại phải bắt đầu bằng số 03.";
    }
    return null; // Hợp lệ
  };

  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    try {
      const phoneError = validatePhoneNumber(personalInfo.phone_number);
      if (phoneError) {
        setError(phoneError);
        setIsSubmitting(false);
        return;
      }
      const activeToken = await ensureActiveToken();
      if (account_type === "user") {
        await ChangeInfoCus(
          UserID,
          {
            full_name: personalInfo.full_name,
            gender: personalInfo.gender,
            phone_number: personalInfo.phone_number,
          },
          activeToken
        );
      } else {
        await ChangeInfoEmp(UserID, personalInfo, activeToken);
      }
      setOriginalInfo(personalInfo);
      setModal({
        isOpen: true,
        text: "Lưu thông tin thành công!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Không thể cập nhật thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm xử lý hủy thay đổi
  const handleCancelChanges = () => {
    setPersonalInfo(originalInfo); // Khôi phục trạng thái gốc
  };

  const handlePasswordChange = async () => {
    setError(null);
    setModalerror(null);
    const activeToken = await ensureActiveToken();
    try {
      await CheckPassword(UserID, formData.oldPassword, activeToken);
    } catch (error) {
      setModalerror("Mật Khẩu Không đúng!");
      return;
    }
    try {
      if (formData.newPassword === formData.oldPassword) {
        setModalerror("Mật khẩu mới trùng với mật khẩu cũ.");
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        setModalerror("Mật khẩu xác nhận không khớp.");
        return;
      }
      if (formData.newPassword.length < 8) {
        setModalerror("Mật khẩu phải có ít nhất 8 kí tự");
        return;
      }
      let InfoChange = { password: formData.newPassword };
      if (account_type === "user")
        await ChangeInfoLogCus(UserID, InfoChange, activeToken);
      else await ChangeInfoLogEmp(UserID, InfoChange, activeToken);
      setShowModal(false);
      setModalerror(null); // Xóa lỗi
      setFormData({
        // Reset nội dung form
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
        newEmail: "",
        confirmNewEmail: "",
      });
      setModal({
        isOpen: true,
        text: "Đổi mật khẩu thành công!",
        type: "success",
      });
      await fetchProfileData();
    } catch (error) {
      console.error("Error changing password:", error);
      setModalerror(
        "Đổi mật khẩu thất bại",
        error.response ? error.response.data : error.message
      );
    }
  };

  const handleEmailChange = async () => {
    setError(null);
    setModalerror(null);
    const activeToken = await ensureActiveToken();
    try {
      await CheckPassword(UserID, formData.oldPassword, activeToken);
    } catch (error) {
      setModalerror("Mật Khẩu Không đúng!");
      return;
    }
    try {
      if (formData.newEmail !== formData.confirmNewEmail) {
        setModalerror("Email xác nhận không khớp.");
        return;
      }
      let InfoChange = { email: formData.newEmail };
      if (account_type === "user")
        await ChangeInfoLogCus(UserID, InfoChange, activeToken);
      else await ChangeInfoLogEmp(UserID, InfoChange, activeToken);
      setShowModal(false);
      setModalerror(null); // Xóa lỗi
      setFormData({
        // Reset nội dung form
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
        newEmail: "",
        confirmNewEmail: "",
      });
      setModal({
        isOpen: true,
        text: "Đổi email thành công!",
        type: "success",
      });
      await fetchProfileData();
    } catch (error) {
      setModalerror("Email đã tồn tại ");
    }
  };

  return (
    <div className={style["profile-container"]}>
      <div className={style["container"]}>
        <div className={style["row"]}>
          <div className={style["col-lg-4"]}>
            <div className={style["user-card"]}>
              <div className={style["brief-info"]}>
                <div className={style["user-img"]}>
                  <img src="assets/images/user-icon.png" alt="" />
                </div>
                <h6>{personalInfo.full_name}</h6>
                <p>{loginInfo.email}</p>
              </div>
            </div>
          </div>
          <div className={style["col-lg-8"]}>
            <div className={style["profile-info"]}>
              <h1>Thông Tin Của Bạn</h1>
              {account_type !== "admin" && (
                <div className={style["row"] + " " + style["user-info"]}>
                  <div className={style["col-lg-4"]}>
                    <div className={style["web-info"]}>
                      <h2>Thông tin cá nhân</h2>
                      <p>Thông tin của bạn luôn được chúng tôi bảo mật.</p>
                    </div>
                  </div>
                  <div className={style["col-lg-8"]}>
                    <div className={style["info-form"]}>
                      <label htmlFor="full-name">Họ và Tên:</label>
                      <input
                        id="full-name"
                        type="text"
                        value={personalInfo.full_name}
                        onChange={(e) => {
                          setPersonalInfo({
                            ...personalInfo,
                            full_name: e.target.value,
                          });
                          if (error) setError("");
                        }}
                        required
                      />
                    </div>
                    <div className={style["info-form"]}>
                      <label htmlFor="gender">Giới tính:</label>
                      <select
                        id="gender"
                        value={personalInfo.gender}
                        onChange={(e) => {
                          setPersonalInfo({
                            ...personalInfo,
                            gender: e.target.value,
                          });
                          if (error) setError("");
                        }}
                      >
                        <option value=""></option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>

                    <div className={style["info-form"]}>
                      <label htmlFor="phone-number">Số Điện Thoại:</label>
                      <input
                        id="phone-number"
                        type="text"
                        value={personalInfo.phone_number}
                        onChange={(e) => {
                          setPersonalInfo({
                            ...personalInfo,
                            phone_number: e.target.value,
                          });
                          if (error) setError("");
                        }}
                        required
                      />
                      {error && (
                        <p className={style["error-message"]}>{error}</p>
                      )}
                    </div>
                    {account_type === "employee" && (
                      <div className={style["info-form"]}>
                        <label htmlFor="address">Địa chỉ:</label>
                        <input
                          id="address"
                          type="text"
                          value={personalInfo.address}
                          onChange={(e) => {
                            setPersonalInfo({
                              ...personalInfo,
                              address: e.target.value,
                            });
                            if (error) setError("");
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={style["row"]}>
                <div className={style["col-lg-4"]}>
                  <div className={style["web-info"]}>
                    <h2>Thông tin đăng nhập</h2>
                    <p>Bạn nên thường xuyên kiểm tra các thông tin đăng nhập</p>
                  </div>
                </div>
                <div className={style["col-lg-8"]}>
                  <div className={style["login-info"]}>
                    <div className={style["login-item"]}>
                      <div className={style["login-item-text"]}>
                        <p>Email:</p>
                        <p>{loginInfo.email}</p>
                      </div>
                      <button
                        className={style["btn-info"]}
                        onClick={() => {
                          setModalType("email");
                          setShowModal(true);
                        }}
                      >
                        Thay đổi Email
                      </button>
                    </div>
                    <div className={style["login-item"]}>
                      <div className={style["login-item-text"]}>
                        <p>Mật khẩu:</p>
                        <p>{loginInfo.password}</p>
                      </div>
                      <button
                        onClick={() => {
                          setModalType("password");
                          setShowModal(true);
                        }}
                        className={style["btn-info"]}
                      >
                        Thay đổi mật khẩu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className={style["button-group"]}>
                <button
                  className={style["btn-info"]}
                  onClick={handleCancelChanges}
                >
                  Hủy
                </button>
                <button
                  className={style["btn-info"]}
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          modalType={modalType}
          showModal={showModal}
          onClose={() => {
            setShowModal(false); // Đóng modal
            setModalerror(null); // Xóa lỗi
            setFormData({
              // Reset nội dung form
              oldPassword: "",
              newPassword: "",
              confirmNewPassword: "",
              newEmail: "",
              confirmNewEmail: "",
            });
          }}
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          handleSubmit={
            modalType === "email" ? handleEmailChange : handlePasswordChange
          }
          Modalerror={Modalerror}
          setModalerror={setModalerror}
          navigate={navigate}
        />
      )}

      {modal.isOpen && (
        <ModalGeneral
          isOpen={modal.isOpen}
          text={modal.text}
          type={modal.type}
          onClose={() => setModal({ isOpen: false })}
          onConfirm={modal.onConfirm}
        />
      )}
    </div>
  );
}

export default Profile;
