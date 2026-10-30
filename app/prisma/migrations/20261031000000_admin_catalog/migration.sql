/*
  UC-15 (FR-ADM-03): Admin sua gia/san pham.
  - SanPham.soNguoiMin/soNguoiMax: so nguoi choi hien thi (truoc day nam trong lib/products.ts), de Admin sua duoc.
  - ChiTietDonHang.giaNiemYetChot: gia niem yet luc tao don, de doi gia sau do khong lam doi tien phat/den bu cua don cu.
    Cot ngoai ERD SRS, bo sung co chu dich. Don cu duoc backfill bang gia hien tai.
*/
BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[SanPham] ADD [soNguoiMax] INT NOT NULL CONSTRAINT [SanPham_soNguoiMax_df] DEFAULT 4,
[soNguoiMin] INT NOT NULL CONSTRAINT [SanPham_soNguoiMin_df] DEFAULT 2;

ALTER TABLE [dbo].[ChiTietDonHang] ADD [giaNiemYetChot] DECIMAL(12,0);

EXEC('
UPDATE c SET c.giaNiemYetChot = s.giaNiemYet
FROM [dbo].[ChiTietDonHang] c
JOIN [dbo].[SanPham] s ON s.id = c.sanPhamId
WHERE c.giaNiemYetChot IS NULL
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
