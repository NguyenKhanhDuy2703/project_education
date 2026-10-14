# Agent Working Memory & Scratchpad Directory

Thư mục này dùng để lưu trữ các file kế hoạch thực thi (**External Working Memory / Scratchpad**) của Agent khi triển khai các tính năng, refactor hoặc sửa lỗi phức tạp.

## Quy chuẩn đặt tên file:
- File kế hoạch: `[task-name].plan.md`
- File scratchpad tạm: `[task-name].scratchpad.md`

## Nguyên tắc:
- Mọi file kế hoạch phải tuân theo cấu trúc 2 tầng: `### Task X` và `- [ ] Subtask X.Y`.
- Agent tự động cập nhật `- [x]` sau khi kiểm chứng thành công từng bước.
