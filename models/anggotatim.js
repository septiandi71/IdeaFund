'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class AnggotaTim extends Model {
    static associate(models) {
      // Asosiasi ke Tim dan Mahasiswa sudah didefinisikan di model Tim dan Mahasiswa
      // melalui belongsToMany
    }
  }
  AnggotaTim.init({
    timId: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    mahasiswaId: { type: DataTypes.UUID, primaryKey: true, allowNull: false }
  }, {
    sequelize,
    modelName: 'AnggotaTim',
    tableName: 'AnggotaTim' // Plural
  });
  return AnggotaTim;
};