/*
  UC-07/08/09 (FR-KHO-01/02, FR-CT-06/07, FR-TTGV-08): tra hang -> kiem dem -> phat -> hoan coc.
  - LinhKien: so luong chuan + gia le niem yet (BRU-04) de tinh den bu.
  - GiaoVan.hoanTatLuc: thoi diem van don chieu tra toi trang thai cuoi (hang ve kho) -> so ngay tre han (BRU-03).
  - BienBanKiemDem.ketQua: JSON ket qua tung linh kiem (khong con la chuoi ngan).
  - DatCoc.phieuQuyetToan: phieu quyet toan hoan coc (JSON), luu vet ca khi hoan 0d.
*/
BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[BienBanKiemDem] ALTER COLUMN [ketQua] NVARCHAR(max) NOT NULL;

ALTER TABLE [dbo].[GiaoVan] ADD [hoanTatLuc] DATETIME2;

ALTER TABLE [dbo].[LinhKien] ADD [giaLe] DECIMAL(12,0),
[soLuong] INT NOT NULL CONSTRAINT [LinhKien_soLuong_df] DEFAULT 1;

ALTER TABLE [dbo].[DatCoc] ADD [phieuQuyetToan] NVARCHAR(max);

-- Thu cong: CHECK cua cot moi. Dung EXEC vi cot vua them chua ton tai luc bien dich batch nay.
EXEC('ALTER TABLE [dbo].[LinhKien] ADD CONSTRAINT [ck_linhkien_soluong] CHECK ([soLuong] >= 1 AND ([giaLe] IS NULL OR [giaLe] >= 0))');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
