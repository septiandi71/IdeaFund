const profileService = require('../services/profileService');

exports.getProfileData = async (req, res, next) => {
  try {
    if (!req.user) {
      const error = new Error('Tidak terautentikasi.');
      error.statusCode = 401;
      throw error;
    }

    const profileData = await profileService.getProfileData(req.user);
    res.status(200).json(profileData);
  } catch (error) {
    console.error('Error di controller getProfileData:', error);
    next(error);
  }
};