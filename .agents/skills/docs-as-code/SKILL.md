---
name: docs-as-code
description: Phân tích tài liệu dự án (Proposal, Project Plan, Product Backlog, Architecture Design, Database Design — PDF/DOCX/XLSX) và viết lại thành Markdown cô đọng nhưng đầy đủ để lưu trong repo (docs-as-code). Analyze and condense project documents into concise, complete Markdown with version, dates, authors, roles and responsibilities. Use whenever the user wants to convert, summarize, condense, index, sync or cross-check project documents into /docs or README, mentions "tài liệu", "docs trong code", "đưa tài liệu vào repo", "tóm tắt tài liệu", "ai làm gì", "version/ngày của tài liệu", or uploads capstone / SRS / proposal / plan / backlog / architecture / database design files — even if they never say "markdown".
---

# docs-as-code

Biến tài liệu Word/PDF/Excel của dự án thành Markdown nằm trong repo, để người đọc (và agent khác) nắm được tài liệu **trong vài phút mà không mất thông tin quan trọng**.

Triết lý: *đủ thông tin* quan trọng hơn *đủ văn phong*. Không cần giữ bìa, mục lục, chữ ký, lý thuyết nền (ví dụ giải thích Scrum). Phải giữ: con số, ID, ngày, tên người, vai trò, ngưỡng, enum, quyết định.

## Cấu trúc 3 phần bắt buộc của mọi file output

Mọi file output Markdown chuyển đổi từ tài liệu đều phải tuân thủ cấu trúc **3 phần rõ ràng**:

| Phần | Nội dung bắt buộc |
|---|---|
| **Phần 1: Thông tin tài liệu (Info)** | Tên tài liệu, Version, Người làm, Scope (Phạm vi), Thời gian, Tham chiếu từ tài liệu nào |
| **Phần 2: Nội dung (Content)** | Toàn bộ nội dung cốt lõi: TL;DR, Who does what, Timeline, nội dung nghiệp vụ/kỹ thuật chi tiết, Revision history, Open issues |
| **Phần 3: Tài liệu tham khảo (References)** | Link tài liệu gốc, link các tài liệu liên quan/tham chiếu trong repo hoặc bên ngoài |

Nếu một trường thông tin không có trong nguồn, ghi `n/a (not stated in source)`. Không tự bịa. Thông tin suy ra từ tài liệu khác thì ghi rõ `(inferred: <nguồn>)`.

## Workflow

1. **Đọc file nguồn.** Đọc `file-reading` skill trước nếu nội dung chưa nằm trong context. PDF: `pdftotext -layout`; chỉ rasterize khi cần xem hình/sơ đồ. Đọc hết, kể cả bảng Revision history và trang "Document name/Information" (thường nằm ngay sau bìa).
2. **Nhận diện `doc_type`** theo bảng dưới.
3. **Gom metadata** (xem "Quy tắc metadata"): tên, version, người làm, scope, thời gian, nguồn tham chiếu.
4. **Mở reference tương ứng** trong `references/` để lấy checklist trích xuất + template.
5. **Viết Markdown** theo khung 3 phần chuẩn, áp dụng quy tắc cô đọng.
6. **Cross-check** với các tài liệu khác của cùng dự án (đọc `references/cross-check.md`). Ghi mâu thuẫn vào `## 2.6. Open issues`, không tự sửa nguồn.
7. **Validate + cập nhật register**: chạy `python scripts/validate_docs.py docs/` và cập nhật `docs/README.md` (bảng tài liệu, đội ngũ, timeline tổng).

## Nhận diện loại tài liệu

| `doc_type` | Dấu hiệu | Reference |
|---|---|---|
| `proposal` | "Project Proposal", Problem Statement, Related Works, Budget, "Description of Product Requirements" | `references/proposal.md` |
| `project-plan` | "Project Plan", Team Organisation, Detailed Schedule (giờ công), Cost Person/Hours | `references/project-plan.md` |
| `product-backlog` | Bảng PB-xx / PBI-xx, "As a / I want / so that", Acceptance Criteria, Sprint No | `references/product-backlog.md` |
| `architecture` | "Architecture Design", Use Case (UC-xx), Quality Attributes, C&C / Module / Allocation view | `references/architecture-design.md` |
| `database` | "Database Design", danh sách collection/table, field–type–constraint | `references/database-design.md` |

Tài liệu không thuộc 5 loại này (SRS, Test Plan, User Guide…): dùng khung chung bên dưới, thêm section đặc thù vào Phần 2, và vẫn giữ đủ 3 phần chuẩn.

## Khung chung của mọi file output

```markdown
---
doc_type: <proposal|project-plan|product-backlog|architecture|database>
title: <tên tài liệu>
project: <tên dự án>
version: "1.1"                 # luôn là chuỗi có nháy
version_source: cover          # cover | revision-history | filename | inferred
authors:
  - {name: Phan Nguyen Anh, alias: Thu, role: Scrum Master}
scope: <phạm vi áp dụng / hệ thống / module>
date: 2026-04-15               # ISO 8601; "n/a" nếu nguồn không có
source_file: <tên file hoặc đường dẫn tài liệu nguồn>
status: final                  # draft | final | approved
language: en
approved_by:
  - {name: Vo Dinh Hieu, title: MSc, role: Mentor}
related_docs: [01-proposal.md]
---

# <Title>

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | <Tên tài liệu đầy đủ> |
| **Version** | <Phiên bản tài liệu, ví dụ: 1.0, 1.1> |
| **Người làm** | <Tên tác giả / người phụ trách kèm vai trò> |
| **Phạm vi (Scope)** | <Phạm vi tài liệu: hệ thống, module, nhóm tính năng hoặc đối tượng áp dụng> |
| **Thời gian** | <Ngày phát hành, hiệu lực hoặc mốc thời gian: YYYY-MM-DD> |
| **Tham chiếu từ** | <File gốc (PDF/Docx/Sheet) hoặc tài liệu nền tảng làm căn cứ> |

## 2. Nội dung chính (Content)

### 2.1. TL;DR
- 3-6 gạch đầu dòng: là gì, cho ai, con số then chốt...

### 2.2. Phân công & Vai trò (Who does what)
- Bảng người / vai trò / trách nhiệm (+ actor hệ thống nếu có)

### 2.3. Lịch trình & Mốc thời gian (Timeline)
- Bảng mốc / sprint / deadline, ISO date

### 2.4. Nội dung chi tiết
- (Section đặc thù theo loại tài liệu: Architecture, Database, Backlog, Requirements... xem reference)

### 2.5. Lịch sử sửa đổi (Revision history)
- Bảng version | date | author | note

### 2.6. Vấn đề tồn đọng (Open issues)
- Mâu thuẫn, thiếu sót, câu hỏi chưa rõ (ghi "None" nếu không có)

## 3. Tài liệu tham khảo (References)

- **Tài liệu nguồn gốc**: [<tên file gốc>](<link-tới-file-gốc>)
- **Tài liệu liên quan**:
  - [<Tên tài liệu 1>](<đường-dẫn-file-hoặc-url>)
  - [<Tên tài liệu 2>](<đường-dẫn-file-hoặc-url>)
- **Tham chiếu khác**: (chuẩn kỹ thuật, spec, ticket Jira/Confluence nếu có)
```

## Quy tắc metadata

- **Tên tài liệu**: Lấy tên chính thức từ trang bìa hoặc tiêu đề tài liệu gốc.
- **Version**: Ưu tiên bìa → Revision history (dòng mới nhất) → tên file. Nếu các nguồn lệch nhau (ví dụ bìa 1.1 nhưng file `ver_1_2`), dùng giá trị ở bìa, đặt `version_source` tương ứng và ghi lệch vào Open issues. Tài liệu không có version nội bộ: lấy từ tên file, `version_source: filename`.
- **Người làm**: Chuẩn hoá tên người thành `Nguyen Khanh Duy`, giữ `alias: Duy` để dùng trong bảng cho gọn. Ghi rõ vai trò (ví dụ: Leader, Product Owner, Dev...).
- **Phạm vi (Scope)**: Tóm tắt ngắn gọn phạm vi áp dụng (hệ thống nào, module nào, nhóm tính năng hoặc đối tượng nào mà tài liệu đề cập).
- **Thời gian**: Chuẩn hoá về `YYYY-MM-DD`. Nguồn có `dd/mm/yyyy` (kiểu VN) và `April 15, 2026` (kiểu EN) trộn lẫn; `dd/mm` là mặc định cho dữ liệu VN, và mơ hồ thì ghi lại trong Open issues. Ngày có vẻ gõ sai giữ nguyên giá trị nguồn và gắn cờ, không tự sửa.
- **Tham chiếu từ tài liệu nào**: Ghi rõ nguồn gốc trực tiếp (tên file Word/PDF/Excel ban đầu) hoặc tài liệu nền tảng làm căn cứ (kèm đường dẫn link nếu có).
- **Người duyệt vs chữ ký**: Bảng chữ ký trống không có nghĩa là chưa duyệt. Dùng "Approved by" trên bìa và cột Approval trong Revision history (`x` = đã duyệt).

## Quy tắc cô đọng

- Bảng thay cho đoạn văn bất cứ khi nào có ≥ 3 thuộc tính lặp lại.
- Mỗi use case / requirement / risk gói trong 1–3 dòng: ai, kích hoạt gì, kết quả, ngưỡng số. Bỏ giọng quảng cáo ("breakthrough", "state-of-the-art").
- Một ý chỉ xuất hiện một lần trong file (các tài liệu nguồn lặp Overview/Motivation/Conclusion rất nhiều).
- Giữ nguyên thuật ngữ kỹ thuật tiếng Anh, ID gốc (PB-04, UC-06, QA02), tên field, enum.
- Sơ đồ: thay bằng một khối ```mermaid``` nhỏ hoặc một câu mô tả kèm `(src: Figure 3)`. Không nhúng ảnh trừ khi người dùng yêu cầu.
- Cuối mỗi section lớn thêm nguồn ngắn `*src: Table 5*` để truy vết về tài liệu gốc.
- Ngôn ngữ output theo ngôn ngữ tài liệu nguồn (trừ khi người dùng yêu cầu khác). Tiêu đề section giữ tiếng Anh để validator và grep hoạt động.
- Bảng quá 15 dòng: vẫn giữ đủ dòng, nhưng rút gọn mô tả. Dữ liệu quan trọng thì không bỏ dòng.

## Bố cục thư mục đầu ra

```
docs/
├── README.md                 # register: bảng tài liệu, đội ngũ, timeline tổng, issues chéo
├── 01-proposal.md
├── 02-project-plan.md
├── 03-product-backlog.md
├── 04-architecture.md
└── 05-database.md
```

`docs/README.md` có 4 phần: **Document register** (doc | version | date | author | approver | status | file), **Team** (tên | ID | vai trò | phụ trách), **Master timeline**, **Cross-document issues**. Xem `examples/spacelens/README.md`.

Khi tài liệu được cập nhật version mới: sửa file tương ứng, thêm dòng vào Revision history, cập nhật register. Không giữ hai version song song trong `docs/`; lịch sử đã có ở git.

## Checklist chất lượng trước khi giao

- [ ] Tuân thủ cấu trúc 3 phần chuẩn: 1. Thông tin tài liệu, 2. Nội dung chính, 3. Tài liệu tham khảo.
- [ ] Phần 1 có đủ 6 trường thông tin: Tên tài liệu, Version, Người làm, Scope (Phạm vi), Thời gian, Tham chiếu từ tài liệu nào.
- [ ] Front-matter YAML đủ trường tương ứng; `version` là chuỗi; `date` theo chuẩn ISO hoặc `n/a`.
- [ ] Phần 2 chứa toàn bộ nội dung nghiệp vụ/kỹ thuật cần thiết (TL;DR, vai trò, lịch trình, chi tiết chức năng, lịch sử thay đổi, vấn đề tồn đọng).
- [ ] Phần 3 chứa đầy đủ link tham chiếu (file gốc, tài liệu liên quan, tài liệu tham khảo bên ngoài).
- [ ] Mỗi người trong tài liệu nguồn xuất hiện trong `Who does what` với vai trò và ít nhất một trách nhiệm/công việc.
- [ ] Mọi ngày, sprint, deadline trong nguồn đều có trong `Timeline`.
- [ ] Mọi ID gốc (PB-, UC-, QA-, bảng/collection) còn nguyên, không bị gộp mất.
- [ ] Mọi con số (giờ công, chi phí, ngưỡng, hiệu năng) khớp nguồn; tổng phụ được tính lại và đúng.
- [ ] Open issues liệt kê mọi mâu thuẫn tìm thấy; không có "sửa ngầm".
- [ ] `python scripts/validate_docs.py docs/` trả về PASS.

## Tài nguyên đi kèm

- `references/*.md`: checklist trích xuất + template cho từng loại tài liệu (đọc đúng file cần dùng).
- `references/cross-check.md`: các phép kiểm tra chéo giữa tài liệu và các lỗi hay gặp.
- `scripts/validate_docs.py`: kiểm tra front-matter, section bắt buộc, định dạng ngày, register.
- `examples/spacelens/`: ví dụ đầu ra thật (register + backlog) và danh sách mâu thuẫn tìm thấy ở bộ tài liệu SpaceLens.
