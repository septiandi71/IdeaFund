'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Admin', { // Plural
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID, // atau Sequelize.STRING(36)
        defaultValue: Sequelize.UUIDV4 // Di model, bukan migrasi
      },
      nama: { type: Sequelize.STRING(255), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      walletAddress: { type: Sequelize.STRING(42), allowNull: false, unique: true },
      otp: { type: Sequelize.STRING(6), allowNull: true },
      otpExpiresAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
    await queryInterface.addIndex('Admin', ['email']);
    await queryInterface.addIndex('Admin', ['walletAddress']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Admin');
  }
};