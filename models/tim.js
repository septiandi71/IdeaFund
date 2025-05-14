'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Tim extends Model {
    static associate(models) {
      Tim.belongsTo(models.Proyek, { foreignKey: 'proyekId', as: 'proyek' });
      Tim.belongsTo(models.Mahasiswa, { foreignKey: 'ketuaId', as: 'ketuaTim' });
      Tim.belongsToMany(models.Mahasiswa, {
        through: models.AnggotaTim, // tabel junction
        foreignKey: 'timId', // FK di AnggotaTim yang merujuk ke Tim.id
        otherKey: 'mahasiswaId', // FK di AnggotaTim yang merujuk ke Mahasiswa.id
        as: 'anggotaList'
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
    tableName: 'Tim' // Plural
  });
  return Tim;
};