'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Tim extends Model {
    static associate(models) {
      Tim.belongsTo(models.Proyek, { foreignKey: 'proyekId', as: 'proyek' });
      Tim.belongsTo(models.Mahasiswa, { foreignKey: 'ketuaId', as: 'ketuaTim' });
      
      // Untuk mendapatkan daftar record AnggotaTim
      Tim.hasMany(models.AnggotaTim, { as: 'anggotaList', foreignKey: 'timId' });
      // Untuk mendapatkan daftar Mahasiswa yang menjadi anggota tim ini
      Tim.belongsToMany(models.Mahasiswa, {
        through: models.AnggotaTim,
        foreignKey: 'timId',
        otherKey: 'mahasiswaId',
        as: 'anggotaMahasiswa' // Alias ini akan digunakan di include pada getProjectById
      });
    }
  }
  Tim.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    proyekId: { type: DataTypes.UUID, allowNull: false, unique: true },
    ketuaId: { type: DataTypes.UUID, allowNull: false }
  }, {
    sequelize,
    modelName: 'Tim',
    tableName: 'Tim'
  });
  return Tim;
};