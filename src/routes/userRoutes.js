// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const uploadTo = require('../middleware/uploadMiddleware');
const {
  register, login, getProfile, changeOwnPassword,
  createUser, getAllUsers, getUserById, updateUser, deleteUser, resetUserPassword
} = require('../controllers/userControllers');

// bebas akses
router.post('/register', uploadTo('users').single('photo'), register);
router.post('/login', login);

// perlu login
router.get('/me', auth, getProfile);
router.put('/me/change-password', auth, changeOwnPassword);

// semua user management harus login
router.use(auth);

router.post('/', uploadTo('users').single('photo'), createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', uploadTo('users').single('photo'), updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/reset-password', resetUserPassword);

module.exports = router;
