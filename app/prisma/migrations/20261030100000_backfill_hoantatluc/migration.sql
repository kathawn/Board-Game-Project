/*
  Van don da toi trang thai cuoi truoc khi co cot hoanTatLuc (UC-07: ngay hang ve kho de tinh phat tre han BRU-03)
  duoc gan thoi diem chay migration nay, de so ngay tre co dinh thay vi troi theo "bay gio".
*/
BEGIN TRY

BEGIN TRAN;

UPDATE [dbo].[GiaoVan]
SET [hoanTatLuc] = SYSUTCDATETIME()
WHERE [hoanTatLuc] IS NULL AND [trangThaiVanChuyen] IN ('DaGiao', 'DaLay');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
