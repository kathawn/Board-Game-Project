/*
  FR-BH-06 (UC-03/UC-04): khach huy don mua/don thue khi con Pending.
  - Them 'Cancelled' vao TrangThaiDon (SRS 3.6 bo sung nhanh re huy o State Machine Hinh 3.6).
*/
BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[DonHang] DROP CONSTRAINT [ck_donhang_trangthai];
ALTER TABLE [dbo].[DonHang] ADD CONSTRAINT [ck_donhang_trangthai] CHECK ([trangThai] IN ('Pending','Confirmed','Active','Overdue','Completed','Closed','Cancelled'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
