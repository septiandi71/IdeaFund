'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class AnggotaTim extends Model {
    static associate(models) {
      AnggotaTim.belongsTo(models.Tim, { as: 'tim', foreignKey: 'timId' }); // Relasi ke Tim
      AnggotaTim.belongsTo(models.Mahasiswa, { as: 'mahasiswa', foreignKey: 'mahasiswaId' }); // Relasi ke Mahasiswa
    }
  }
  AnggotaTim.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    timId: { type: DataTypes.UUID, allowNull: false },
    mahasiswaId: { type: DataTypes.UUID, allowNull: false }
  }, {
    sequelize,
    modelName: 'AnggotaTim',
    tableName: 'AnggotaTim'
  });
  return AnggotaTim;
};