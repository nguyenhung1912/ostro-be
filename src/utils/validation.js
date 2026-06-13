import mongoose from "mongoose";

export const isValidObjectId = (value) => mongoose.isValidObjectId(value);

export const areValidObjectIds = (values) =>
  Array.isArray(values) && values.every(isValidObjectId);

export const validateAndNormalizeMemberIds = (
  memberIds,
  emptyMessage = "Danh sách thành viên là bắt buộc.",
) => {
  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    return { valid: false, status: 400, message: emptyMessage };
  }
  if (!areValidObjectIds(memberIds)) {
    return {
      valid: false,
      status: 400,
      message: "Danh sách thành viên không hợp lệ.",
    };
  }
  const uniqueMemberIds = [...new Set(memberIds.map((id) => id.toString()))];
  return { valid: true, uniqueMemberIds };
};
