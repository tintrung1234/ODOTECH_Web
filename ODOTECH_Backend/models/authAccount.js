function mapAuthAccountRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    username: row.username ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    role_system: row.role_system ?? "",
    status: row.status ?? "",
    password_hash: row.password_hash ?? "",
  };
}

function mapRegisteredAccountRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    username: row.username ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    role_system: row.role_system ?? "",
    status: row.status ?? "",
  };
}

module.exports = {
  mapAuthAccountRow,
  mapRegisteredAccountRow,
};
