export function checkPasswordRequirements(password) {
  const requirements = [
    {
      id: "length",
      text: "Mật khẩu phải có ít nhất 8 ký tự",
      valid: password.length >= 8,
    },
    {
      id: "lowercase",
      text: "Mật khẩu phải có ít nhất 1 chữ cái thường (a-z)",
      valid: /[a-z]/.test(password),
    },
    {
      id: "number",
      text: "Mật khẩu phải có ít nhất 1 số (0-9)",
      valid: /[0-9]/.test(password),
    },
  ];

  return requirements.find((req) => !req.valid); // Lấy yêu cầu đầu tiên chưa đạt
}
