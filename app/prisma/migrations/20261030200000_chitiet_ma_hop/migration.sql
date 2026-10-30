/*
  ChiTietDonHang.maHop: ma hop game vat ly xuat kho cho dong don, ghi luc ban giao (UC-06) de UC-08 biet dung hop
  can kiem dem (khong con de Staff tu chon). Cot ngoai ERD SRS, bo sung co chu dich.
*/
BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[ChiTietDonHang] ADD [maHop] NVARCHAR(1000);

-- Backfill don da ban giao truoc khi co cot: chi gan khi KHONG mo ho (san pham do dung 1 hop Rented va dung 1 dong
-- Active/Overdue chua co maHop). Truong hop con lai de trong, Staff/seed gan tay.
EXEC('
UPDATE c SET c.maHop = (SELECT TOP 1 h.maHop FROM [dbo].[HopGame] h WHERE h.sanPhamId = c.sanPhamId AND h.trangThai = ''Rented'')
FROM [dbo].[ChiTietDonHang] c
JOIN [dbo].[DonHang] d ON d.id = c.donHangId
WHERE c.maHop IS NULL AND d.loai = ''Thue'' AND d.trangThai IN (''Active'', ''Overdue'')
  AND (SELECT COUNT(*) FROM [dbo].[HopGame] h WHERE h.sanPhamId = c.sanPhamId AND h.trangThai = ''Rented'') = 1
  AND (SELECT COUNT(*) FROM [dbo].[ChiTietDonHang] c2 JOIN [dbo].[DonHang] d2 ON d2.id = c2.donHangId
       WHERE c2.sanPhamId = c.sanPhamId AND c2.maHop IS NULL AND d2.loai = ''Thue'' AND d2.trangThai IN (''Active'', ''Overdue'')) = 1
');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
