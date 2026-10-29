-- Thu cong: sinh ma don / ma thanh toan nguyen tu (khong trung khi nhieu webhook chay dong thoi).
-- DT-00001, DT-00002 da dung boi seed -> sequence bat dau o 3.
CREATE SEQUENCE [dbo].[seq_madon_thue] AS BIGINT START WITH 3 INCREMENT BY 1;
CREATE SEQUENCE [dbo].[seq_mathanhtoan] AS BIGINT START WITH 1 INCREMENT BY 1;
