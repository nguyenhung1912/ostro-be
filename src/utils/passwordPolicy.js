export const PASSWORD_MIN_LENGTH = 10;

export const PASSWORD_POLICY_MESSAGE =
  "Mật khẩu phải có ít nhất 10 ký tự và bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt.";

export const isStrongPassword = (password) => {
  if (typeof password !== "string") {
    return false;
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  // /\d/ == [0 - 9]
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return hasLowercase && hasUppercase && hasNumber && hasSymbol;
};
