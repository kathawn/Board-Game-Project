/*
  Backfill SanPham.soNguoiMin/soNguoiMax (them o migration 20261031000000_admin_catalog voi mac dinh 2-4)
  bang so lieu goc cua cac san pham mau, de khong hien sai so nguoi choi tren du lieu da co.
*/
BEGIN TRY

BEGIN TRAN;

UPDATE [dbo].[SanPham] SET [soNguoiMin] = 2, [soNguoiMax] = 6 WHERE [slug] = N'co-ty-phu';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 8, [soNguoiMax] = 18 WHERE [slug] = N'ma-soi';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 3, [soNguoiMax] = 4 WHERE [slug] = N'catan';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 2, [soNguoiMax] = 10 WHERE [slug] = N'uno';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 2, [soNguoiMax] = 7 WHERE [slug] = N'7-wonders';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 2, [soNguoiMax] = 4 WHERE [slug] = N'azul';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 4, [soNguoiMax] = 7 WHERE [slug] = N'bang';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 2, [soNguoiMax] = 5 WHERE [slug] = N'carcassonne';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 2, [soNguoiMax] = 8 WHERE [slug] = N'codenames';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 2, [soNguoiMax] = 6 WHERE [slug] = N'coup';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 2, [soNguoiMax] = 5 WHERE [slug] = N'exploding-kittens';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 1, [soNguoiMax] = 4 WHERE [slug] = N'gloomhaven';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 2, [soNguoiMax] = 4 WHERE [slug] = N'root';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 1, [soNguoiMax] = 5 WHERE [slug] = N'scythe';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 2, [soNguoiMax] = 4 WHERE [slug] = N'splendor';
UPDATE [dbo].[SanPham] SET [soNguoiMin] = 2, [soNguoiMax] = 5 WHERE [slug] = N'ticket-to-ride';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
