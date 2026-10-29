/** Đọc DATABASE_URL dạng Prisma (sqlserver://host:port;database=...;user=...;password={...};...) thành
 * cấu hình cho @prisma/adapter-mssql. Dùng chung cho app (lib/db/client.ts) và seed (prisma/seed.ts). */
export function parseSqlServerUrl(url: string) {
  const [hostPort, ...rest] = url.replace(/^sqlserver:\/\//, "").split(";");
  const [server, port] = hostPort.split(":");
  const opts = Object.fromEntries(
    rest
      .filter(Boolean)
      .map((kv) => {
        const i = kv.indexOf("=");
        return [kv.slice(0, i).trim().toLowerCase(), kv.slice(i + 1).trim().replace(/^\{|\}$/g, "")];
      }),
  );
  return {
    server,
    port: port ? Number(port) : 1433,
    database: opts.database,
    user: opts.user,
    password: opts.password,
    options: { trustServerCertificate: opts.trustservercertificate === "true", encrypt: opts.encrypt !== "false" },
  };
}
