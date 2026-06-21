import Admin from "./Admin.js";
import Arquivo from "./Arquivo.js";
import Cliente from "./Cliente.js";
import Comunicado from "./Comunicado.js";
import Horario from "./Horario.js";
import LogSistema from "./LogSistema.js";
import Modalidade from "./Modalidade.js";
import Quadra from "./Quadra.js";
import QuadraModalidade from "./QuadraModalidade.js";
import Reserva from "./Reserva.js";

Admin.hasMany(LogSistema, { foreignKey: "adminId", as: "logs" });
LogSistema.belongsTo(Admin, { foreignKey: "adminId", as: "administrador" });
Admin.hasMany(Arquivo, { foreignKey: "adminId", as: "arquivos" });
Arquivo.belongsTo(Admin, { foreignKey: "adminId", as: "administrador" });

Cliente.hasMany(Reserva, { foreignKey: "clienteId", as: "reservas" });
Reserva.belongsTo(Cliente, { foreignKey: "clienteId", as: "cliente" });
Quadra.hasMany(Horario, { foreignKey: "quadraId", as: "horarios" });
Horario.belongsTo(Quadra, { foreignKey: "quadraId", as: "quadra" });
Quadra.hasMany(Reserva, { foreignKey: "quadraId", as: "reservas" });
Reserva.belongsTo(Quadra, { foreignKey: "quadraId", as: "quadra" });
Modalidade.hasMany(Reserva, { foreignKey: "modalidadeId", as: "reservas" });
Reserva.belongsTo(Modalidade, { foreignKey: "modalidadeId", as: "modalidade" });
Horario.hasMany(Reserva, { foreignKey: "horarioId", as: "reservas" });
Reserva.belongsTo(Horario, { foreignKey: "horarioId", as: "horario" });

Quadra.belongsToMany(Modalidade, { through: QuadraModalidade, foreignKey: "quadraId", otherKey: "modalidadeId", as: "modalidades" });
Modalidade.belongsToMany(Quadra, { through: QuadraModalidade, foreignKey: "modalidadeId", otherKey: "quadraId", as: "quadras" });

export { Admin, Arquivo, Cliente, Comunicado, Horario, LogSistema, Modalidade, Quadra, QuadraModalidade, Reserva };
